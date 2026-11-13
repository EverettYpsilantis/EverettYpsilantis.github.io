/* =========================================================================
   Everett Ypsilantis — portfolio
   Every section on the page is generated from the JSON files in /data.
   To add a project: append an object to data/projects.json. Nothing here
   or in index.html needs to change.
   ========================================================================= */

(function () {
  'use strict';

  var DATA = {
    site: 'data/site.json',
    projects: 'data/projects.json',
    experience: 'data/experience.json'
  };

  /* Filter bar order. A project whose category is not in this list still
     renders and is still reachable under "All". */
  var CATEGORIES = [
    'GIS & Spatial Analysis',
    'Machine Learning & Analytics',
    'AI & Agentic Systems',
    'Remote Sensing'
  ];

  var ALL = 'All';

  var state = {
    projects: [],
    category: ALL,
    lightbox: { images: [], index: 0, opener: null }
  };

  /* ------------------------------------------------------------- helpers */

  function h(tag, props, children) {
    var node = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (key) {
      var value = props[key];
      if (value === null || value === undefined || value === false) return;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'dataset') Object.assign(node.dataset, value);
      else node.setAttribute(key, value);
    });
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  // Body text from JSON with **bold** spans. Builds text nodes and <strong>
  // elements only, so data never reaches innerHTML.
  function richText(str) {
    return String(str).split(/\*\*(.+?)\*\*/).map(function (part, i) {
      return i % 2 ? h('strong', { text: part }) : document.createTextNode(part);
    });
  }

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function slug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isArray(value) {
    return Array.isArray(value) && value.length > 0;
  }

  // Absolute URL: a relative url() inside a custom property resolves
  // against the stylesheet (css/), not the page.
  function cssUrl(path) {
    return 'url("' + new URL(path, document.baseURI).href + '")';
  }

  /* ------------------------------------------------------------ hash state */

  function parseHash() {
    var raw = window.location.hash.replace(/^#/, '');
    var parts = raw.split('?');
    var params = new URLSearchParams(parts[1] || '');
    return { section: parts[0] || '', category: params.get('category') || ALL };
  }

  function writeHash(category) {
    var hash = '#projects';
    if (category && category !== ALL) hash += '?category=' + encodeURIComponent(category);
    window.history.replaceState(null, '', hash);
  }

  /* ------------------------------------------------------------ site data */

  function renderSite(site) {
    document.title = site.name + ' — Geospatial, Analytics & AI';
    var meta = $('meta[name="description"]');
    if (meta && site.metaDescription) meta.setAttribute('content', site.metaDescription);

    $('[data-site-brand]').textContent = site.initials || site.name;
    $('[data-site-name]').textContent = site.name;
    $('[data-year]').textContent = String(new Date().getFullYear());

    var menu = $('[data-nav-menu]');
    (site.nav || []).forEach(function (item) {
      menu.appendChild(h('li', {}, [
        h('a', { class: 'nav__link', href: item.href, text: item.label })
      ]));
    });

    var hero = site.hero || {};
    if (hero.image) {
      $('#hero').style.setProperty('--hero-image', cssUrl(hero.image));
      $('#hero').classList.add('hero--image');
    }
    if (site.education && site.education.image) {
      $('#education').style.setProperty('--section-image', cssUrl(site.education.image));
      $('#education').classList.add('section--image');
    }
    $('[data-hero-eyebrow]').textContent = hero.eyebrow || '';
    $('[data-hero-name]').textContent = site.name;
    $('[data-hero-tagline]').textContent = site.tagline || '';

    var ctas = $('[data-hero-ctas]');
    [
      { cta: hero.ctaPrimary, cls: 'btn btn--primary' },
      { cta: hero.ctaSecondary, cls: 'btn btn--ghost' }
    ].forEach(function (entry) {
      if (!entry.cta) return;
      ctas.appendChild(h('a', { class: entry.cls, href: entry.cta.href, text: entry.cta.label }));
    });

    var about = $('[data-about]');
    if (site.about && site.about.heading) {
      about.appendChild(h('h3', { text: site.about.heading }));
    }
    ((site.about && site.about.paragraphs) || []).forEach(function (para) {
      about.appendChild(h('p', { text: para }));
    });

    renderContact(site.contact || {});
  }

  function renderContact(contact) {
    var wrap = $('[data-contact]');
    if (contact.blurb) wrap.appendChild(h('p', { class: 'contact__blurb', text: contact.blurb }));

    var list = h('ul', { class: 'contact__links' });
    if (contact.email && contact.form) {
      wrap.appendChild(buildContactForm(contact.email, contact.form));
      wrap.appendChild(h('p', { class: 'contact__direct' }, [
        document.createTextNode((contact.form.directLabel || 'Or email directly:') + ' '),
        h('a', { href: 'mailto:' + contact.email, text: contact.emailLabel || contact.email })
      ]));
    } else if (contact.email) {
      list.appendChild(h('li', {}, [
        h('a', { href: 'mailto:' + contact.email, text: contact.emailLabel || contact.email })
      ]));
    }
    if (contact.phone) {
      list.appendChild(h('li', {}, [
        h('a', { href: 'tel:' + contact.phone.replace(/[^\d+]/g, ''), text: contact.phone })
      ]));
    }
    if (contact.linkedin) {
      list.appendChild(h('li', {}, [
        h('a', { href: contact.linkedin, rel: 'noopener', target: '_blank', text: 'LinkedIn' })
      ]));
    }
    if (contact.github) {
      list.appendChild(h('li', {}, [
        h('a', { href: contact.github, rel: 'noopener', target: '_blank', text: 'GitHub' })
      ]));
    }
    if (list.childNodes.length) wrap.appendChild(list);
  }

  // A static site cannot send mail itself, so the form builds a mailto: link
  // with the visitor's name, email, and message filled in and opens their
  // email app. Native validation (required, type=email) runs before submit.
  function buildContactForm(email, form) {
    function field(id, tag, type, placeholder, autocomplete) {
      var input = h(tag, {
        class: 'contact-form__input',
        id: id,
        name: id,
        type: tag === 'input' ? type : null,
        placeholder: placeholder,
        autocomplete: autocomplete,
        rows: tag === 'textarea' ? '5' : null,
        required: 'required'
      });
      return h('div', { class: 'contact-form__field' }, [
        h('label', { class: 'visually-hidden', for: id, text: placeholder }),
        input
      ]);
    }

    var node = h('form', { class: 'contact-form' }, [
      field('contact-name', 'input', 'text', form.namePlaceholder || 'Your name', 'name'),
      field('contact-email', 'input', 'email', form.emailPlaceholder || 'Your email', 'email'),
      field('contact-message', 'textarea', null, form.messagePlaceholder || 'Your message', 'off'),
      h('button', { type: 'submit', class: 'btn btn--primary contact-form__submit', text: form.submitLabel || 'Send Message' }),
      form.note ? h('p', { class: 'contact-form__note', text: form.note }) : null
    ]);

    node.addEventListener('submit', function (event) {
      event.preventDefault();
      var name = node.elements['contact-name'].value.trim();
      var from = node.elements['contact-email'].value.trim();
      var message = node.elements['contact-message'].value.trim();
      var subject = (form.subjectPrefix || 'Portfolio inquiry from') + ' ' + name;
      var body = message + '\n\n' + name + '\n' + from;
      window.location.href = 'mailto:' + email +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    });

    return node;
  }

  /* -------------------------------------------------------------- projects */

  function renderFilters() {
    var bar = $('[data-filters]');
    var used = CATEGORIES.filter(function (category) {
      return state.projects.some(function (project) { return project.category === category; });
    });
    var extras = state.projects
      .map(function (project) { return project.category; })
      .filter(function (category) {
        return category && CATEGORIES.indexOf(category) === -1;
      });
    var categories = [ALL].concat(used, Array.from(new Set(extras)));

    categories.forEach(function (category) {
      var button = h('button', {
        type: 'button',
        class: 'filter',
        'aria-pressed': 'false',
        dataset: { category: category }
      });
      button.textContent = category;
      button.addEventListener('click', function () {
        applyFilter(category);
        writeHash(category);
      });
      bar.appendChild(button);
    });
  }

  function applyFilter(category) {
    state.category = category;

    $$('[data-filters] .filter').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.category === category));
    });

    var visible = 0;
    $$('[data-projects] .card').forEach(function (card) {
      var match = category === ALL || card.dataset.category === category;
      card.hidden = !match;
      if (match) visible += 1;
    });

    var label = visible === 1 ? 'project' : 'projects';
    $('[data-filter-status]').textContent = category === ALL
      ? 'Showing all ' + visible + ' ' + label
      : 'Showing ' + visible + ' ' + label + ' in ' + category;
  }

  function renderProjects(projects) {
    state.projects = projects.slice().sort(function (a, b) {
      return (b.featured === true) - (a.featured === true);
    });

    var grid = $('[data-projects]');
    state.projects.forEach(function (project) {
      grid.appendChild(buildCard(project));
    });
  }

  function projectId(project) {
    return project.id || slug(project.title);
  }

  function buildCard(project) {
    var id = projectId(project);
    var titleId = 'title-' + id;

    var card = h('article', {
      class: 'card',
      id: 'project-' + id,
      dataset: { category: project.category || '' }
    });
    applyAccent(card, project);

    if (isArray(project.images)) {
      card.appendChild(h('img', {
        class: 'card__thumb',
        src: project.images[0].src,
        alt: project.images[0].alt || '',
        loading: 'lazy',
        decoding: 'async'
      }));
    }

    var meta = h('div', { class: 'card__meta' }, [
      h('span', { text: project.category || '' }),
      project.featured ? h('span', { class: 'card__badge', text: 'Featured' }) : null
    ]);

    var submetaParts = [project.role, project.client, project.dateRange].filter(Boolean);

    // The button's ::after stretches over the whole card, so clicking
    // anywhere on it opens the project while keeping one real control.
    var open = h('button', {
      type: 'button',
      class: 'card__open',
      'aria-haspopup': 'dialog',
      'aria-describedby': titleId,
      text: 'View project'
    });
    open.addEventListener('click', function () {
      openViewer(project, open);
    });

    var body = h('div', { class: 'card__body' }, [
      meta,
      h('h3', { class: 'card__title', id: titleId, text: project.title || '' }),
      submetaParts.length ? h('p', { class: 'card__submeta', text: submetaParts.join(' · ') }) : null,
      project.teaser ? h('p', { class: 'card__teaser', text: project.teaser }) : null,
      isArray(project.tools) ? buildTags(project.tools) : null,
      open
    ]);
    card.appendChild(body);

    return card;
  }

  // Optional per-project accent ("accent": "red" in projects.json). The
  // palette for each accent name lives in css/styles.css.
  function applyAccent(node, project) {
    if (project.accent) node.dataset.accent = project.accent;
    else delete node.dataset.accent;
  }

  function buildTags(tools) {
    var list = h('ul', { class: 'tags' });
    tools.forEach(function (tool) {
      list.appendChild(h('li', { class: 'tag', text: tool }));
    });
    return list;
  }

  /* ------------------------------------------------------- project viewer */

  var viewer = { root: null, panel: null, content: null, opener: null };

  function initViewer() {
    viewer.root = $('[data-viewer]');
    viewer.panel = $('[data-viewer-panel]');
    viewer.content = $('[data-viewer-content]');

    $('[data-viewer-close]').addEventListener('click', function () {
      viewer.root.close();
    });
    // Clicks on the dimmed margin around the panel land on the dialog itself.
    viewer.root.addEventListener('click', function (event) {
      if (event.target === viewer.root) viewer.root.close();
    });
    viewer.root.addEventListener('close', function () {
      document.documentElement.classList.remove('has-viewer');
      writeHash(state.category);
      if (viewer.opener) viewer.opener.focus();
      viewer.opener = null;
    });
  }

  function openViewer(project, opener) {
    viewer.opener = opener || null;
    viewer.content.replaceChildren(buildViewer(project));
    applyAccent(viewer.panel, project);
    if (!viewer.root.open) viewer.root.showModal();
    viewer.panel.scrollTop = 0;
    document.documentElement.classList.add('has-viewer');
    window.history.replaceState(null, '', '#project-' + projectId(project));
  }

  function openViewerById(id) {
    var project = state.projects.find(function (p) { return 'project-' + projectId(p) === id; });
    if (!project) return false;
    var card = document.getElementById(id);
    openViewer(project, card ? $('.card__open', card) : null);
    return true;
  }

  // Every figure image in the project, in reading order, so the lightbox
  // arrows step through the whole story rather than one row.
  function collectFigureImages(project) {
    var all = [];
    (project.writeup || []).forEach(function (block) {
      (block.figures || []).forEach(function (row) {
        (row.images || []).forEach(function (image) { all.push(image); });
      });
    });
    return all;
  }

  function buildViewer(project) {
    var figureImages = collectFigureImages(project);
    var root = h('article', { class: 'viewer__article' });

    var submetaParts = [project.role, project.client, project.dateRange].filter(Boolean);
    var ctas = null;
    if (isArray(project.links)) {
      ctas = h('div', { class: 'viewer__ctas' });
      project.links.forEach(function (link, index) {
        ctas.appendChild(h('a', {
          class: index === 0 ? 'btn btn--primary' : 'btn btn--ghost',
          href: link.url,
          rel: 'noopener',
          target: '_blank',
          text: link.label
        }));
      });
    }

    root.appendChild(h('header', { class: 'viewer__header' }, [
      h('div', { class: 'card__meta' }, [
        h('span', { text: project.category || '' }),
        project.featured ? h('span', { class: 'card__badge', text: 'Featured' }) : null
      ]),
      h('h2', { class: 'viewer__title', id: 'viewer-title', text: project.title || '' }),
      submetaParts.length ? h('p', { class: 'viewer__submeta', text: submetaParts.join(' · ') }) : null,
      project.teaser ? h('p', { class: 'viewer__lead', text: project.teaser }) : null,
      isArray(project.tools) ? buildTags(project.tools) : null,
      ctas
    ]));

    (project.writeup || []).forEach(function (block, index) {
      root.appendChild(buildViewerSection(block, index, figureImages));
    });

    var footer = h('footer', { class: 'viewer__footer' });

    if (isArray(project.dataSources)) {
      var sources = h('ul', { class: 'sources' });
      project.dataSources.forEach(function (source) {
        sources.appendChild(h('li', { text: source }));
      });
      footer.appendChild(h('div', { class: 'detail-block' }, [
        h('h4', { text: 'Data sources' }),
        sources
      ]));
    }

    if (project.confidentialityNote) {
      footer.appendChild(h('p', { class: 'note', text: project.confidentialityNote }));
    }

    if (footer.childNodes.length) root.appendChild(footer);
    return root;
  }

  function buildViewerSection(block, index, figureImages) {
    var heading = block.heading ? h('h3', { class: 'viewer__heading' }, [
      h('span', { class: 'viewer__step', text: String(index + 1).padStart(2, '0') }),
      document.createTextNode(block.heading)
    ]) : null;

    var text = block.body ? h('div', { class: 'viewer__text' }, [h('p', null, richText(block.body))]) : null;

    var figures = null;
    if (isArray(block.figures)) {
      figures = h('div', { class: 'viewer__figures' });
      block.figures.forEach(function (row) {
        figures.appendChild(buildFigureRow(row, figureImages));
      });
    }

    // mediaFirst puts the imagery directly under the heading, text after.
    var order = block.mediaFirst ? [heading, figures, text] : [heading, text, figures];
    return h('section', { class: 'viewer__section' }, order);
  }

  function buildFigureRow(row, figureImages) {
    var images = row.images || [];
    var grid = h('div', { class: 'figure-row__grid' });
    grid.style.setProperty('--cols', String(Math.max(images.length, 1)));

    // Side-by-side comparisons: render every image in the row at the first
    // image's size and shape so the pair lines up edge to edge.
    var first = images[0];
    if (images.length > 1 && first && first.width && first.height) {
      grid.classList.add('figure-row__grid--matched');
      grid.style.setProperty('--match-w', first.width + 'px');
      grid.style.setProperty('--ratio', first.width + ' / ' + first.height);
    }

    images.forEach(function (image) {
      var button = h('button', {
        type: 'button',
        class: 'figure__btn',
        'aria-label': 'View full size: ' + (image.alt || image.caption || 'project image')
      }, [
        h('img', {
          src: image.src,
          alt: image.alt || '',
          width: image.width ? String(image.width) : null,
          height: image.height ? String(image.height) : null,
          loading: 'lazy',
          decoding: 'async'
        }),
        image.label ? h('span', { class: 'figure__label', 'aria-hidden': 'true', text: image.label }) : null
      ]);
      button.addEventListener('click', function () {
        openLightbox(figureImages, figureImages.indexOf(image), button);
      });
      grid.appendChild(h('figure', { class: 'figure' }, [
        button,
        image.caption ? h('figcaption', { class: 'figure__caption', text: image.caption }) : null
      ]));
    });

    var legend = null;
    if (isArray(row.legend)) {
      legend = h('ul', { class: 'legend', 'aria-label': 'Map legend' });
      row.legend.forEach(function (entry) {
        var swatch = h('span', { class: 'legend__swatch', 'aria-hidden': 'true' });
        swatch.style.setProperty('--swatch', entry.color);
        legend.appendChild(h('li', {}, [swatch, document.createTextNode(entry.label)]));
      });
    }

    return h('div', { class: 'figure-row' }, [
      grid,
      legend,
      row.caption ? h('p', { class: 'figure-row__caption', text: row.caption }) : null
    ]);
  }

  /* ------------------------------------------------------------ experience */

  function renderExperience(data) {
    var timeline = $('[data-experience]');
    (data.roles || []).forEach(function (role) {
      var bullets = h('ul', { class: 'timeline__bullets' });
      (role.bullets || []).forEach(function (bullet) {
        bullets.appendChild(h('li', { text: bullet }));
      });

      var orgParts = [role.org, role.location].filter(Boolean);

      timeline.appendChild(h('li', { class: 'timeline__item' }, [
        h('p', { class: 'timeline__dates', text: role.dateRange || '' }),
        h('h3', { class: 'timeline__title', text: role.title || '' }),
        orgParts.length ? h('p', { class: 'timeline__org', text: orgParts.join(' · ') }) : null,
        bullets
      ]));
    });

    renderSkills(data.skills || {});
    renderEducation(data);
  }

  function renderSkills(skills) {
    var wrap = $('[data-skills]');
    Object.keys(skills).forEach(function (group) {
      var list = h('ul');
      (skills[group] || []).forEach(function (skill) {
        list.appendChild(h('li', { class: 'tag', text: skill }));
      });
      wrap.appendChild(h('div', { class: 'skill-group' }, [
        h('h3', { text: group }),
        list
      ]));
    });
  }

  function renderEducation(data) {
    var heroCredentials = $('[data-hero-credentials]');
    (data.education || []).forEach(function (entry) {
      if (!entry.short) return;
      heroCredentials.appendChild(h('li', {}, [
        h('a', { class: 'hero__credential', href: '#education' }, [
          h('span', { class: 'hero__credential-school', text: entry.school || '' }),
          h('span', { class: 'hero__credential-degree', text: entry.short })
        ])
      ]));
    });

    var wrap = $('[data-education]');
    (data.awards || []).forEach(function (award) {
      var meta = [award.org, award.date].filter(Boolean);
      wrap.appendChild(h('article', { class: 'award' }, [
        h('p', { class: 'award__label', text: 'Award' }),
        h('h3', { class: 'award__title', text: award.title || '' }),
        meta.length ? h('p', { class: 'award__meta', text: meta.join(' · ') }) : null,
        award.notes ? h('p', { class: 'award__notes', text: award.notes }) : null
      ]));
    });
    var degrees = h('div', { class: 'credentials__degrees' });
    (data.education || []).forEach(function (entry) {
      var coursework = null;
      if (isArray(entry.coursework)) {
        coursework = h('ul', { class: 'degree__coursework', 'aria-label': 'Focus areas' });
        entry.coursework.forEach(function (course) {
          coursework.appendChild(h('li', { class: 'tag', text: course }));
        });
      }
      var meta = [entry.location, entry.dateRange].filter(Boolean);

      degrees.appendChild(h('article', { class: 'degree' }, [
        entry.school ? h('p', { class: 'degree__school', text: entry.school }) : null,
        h('h3', { class: 'degree__title', text: entry.degree || '' }),
        entry.field ? h('p', { class: 'degree__field', text: entry.field }) : null,
        meta.length ? h('p', { class: 'degree__meta', text: meta.join(' · ') }) : null,
        entry.notes ? h('p', { class: 'degree__notes', text: entry.notes }) : null,
        coursework
      ]));
    });
    wrap.appendChild(degrees);

  }

  /* -------------------------------------------------------------- lightbox */

  var lightbox = {
    root: null,
    img: null,
    caption: null
  };

  function initLightbox() {
    lightbox.root = $('#lightbox');
    lightbox.img = $('[data-lightbox-img]');
    lightbox.caption = $('[data-lightbox-caption]');

    $$('[data-lightbox-close]').forEach(function (button) {
      button.addEventListener('click', closeLightbox);
    });
    $('[data-lightbox-prev]').addEventListener('click', function () { stepLightbox(-1); });
    $('[data-lightbox-next]').addEventListener('click', function () { stepLightbox(1); });

    // A modal <dialog> traps focus and stacks above the project viewer.
    // Escape fires 'cancel'; route it through closeLightbox for focus return.
    lightbox.root.addEventListener('cancel', function (event) {
      event.preventDefault();
      closeLightbox();
    });
    lightbox.root.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') stepLightbox(-1);
      else if (event.key === 'ArrowRight') stepLightbox(1);
    });
  }

  function openLightbox(images, index, opener) {
    state.lightbox.images = images;
    state.lightbox.index = Math.max(index, 0);
    state.lightbox.opener = opener;
    showLightboxImage();
    lightbox.root.showModal();
    document.body.style.overflow = 'hidden';
    $('.lightbox__btn--close', lightbox.root).focus();
  }

  function showLightboxImage() {
    var image = state.lightbox.images[state.lightbox.index];
    if (!image) return;
    lightbox.img.src = image.src;
    lightbox.img.alt = image.alt || '';
    lightbox.caption.textContent = image.caption || '';

    var multiple = state.lightbox.images.length > 1;
    $('[data-lightbox-prev]').hidden = !multiple;
    $('[data-lightbox-next]').hidden = !multiple;
  }

  function stepLightbox(delta) {
    var total = state.lightbox.images.length;
    if (!total) return;
    state.lightbox.index = (state.lightbox.index + delta + total) % total;
    showLightboxImage();
  }

  function closeLightbox() {
    lightbox.root.close();
    document.body.style.overflow = '';
    if (state.lightbox.opener) state.lightbox.opener.focus();
    state.lightbox.opener = null;
  }

  /* ------------------------------------------------------------ navigation */

  function initNav() {
    var toggle = $('#nav-toggle');
    var menu = $('#nav-menu');

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('is-open', !open);
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
      }
    });

    var header = $('#site-header');
    window.addEventListener('scroll', function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    }, { passive: true });
  }

  function initScrollSpy() {
    var links = {};
    $$('#nav-menu a').forEach(function (link) {
      links[link.getAttribute('href').replace(/^#/, '')] = link;
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(links).forEach(function (id) {
          links[id].classList.toggle('is-active', id === entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    Object.keys(links).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* ----------------------------------------------------------------- boot */

  function showLoadError(error) {
    var main = $('#main');
    main.prepend(h('div', { class: 'container' }, [
      h('div', { class: 'load-error' }, [
        h('p', {}, [
          h('strong', { text: 'Content failed to load. ' }),
          document.createTextNode(
            'This site reads its content from the JSON files in /data, which browsers will not fetch ' +
            'over file://. Serve the folder over HTTP (for example: python -m http.server) and reload.'
          )
        ]),
        h('p', { class: 'note', text: String(error) })
      ])
    ]));
  }

  function fetchJSON(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (response) {
      if (!response.ok) throw new Error(path + ' → HTTP ' + response.status);
      return response.json();
    });
  }

  function init() {
    initNav();
    initViewer();
    initLightbox();

    Promise.all([fetchJSON(DATA.site), fetchJSON(DATA.projects), fetchJSON(DATA.experience)])
      .then(function (results) {
        renderSite(results[0]);
        renderProjects(results[1]);
        renderFilters();
        renderExperience(results[2]);
        initScrollSpy();

        var hash = parseHash();
        var known = state.projects.some(function (project) {
          return project.category === hash.category;
        });
        applyFilter(known ? hash.category : ALL);

        var target = hash.section && document.getElementById(hash.section);
        if (target) {
          var isCard = target.classList.contains('card');
          var scrollTarget = isCard ? document.getElementById('projects') : target;
          scrollTarget.scrollIntoView({ behavior: 'auto' });
          if (isCard) openViewerById(hash.section);
        }
      })
      .catch(showLoadError);

    window.addEventListener('hashchange', function () {
      var hash = parseHash();
      if (hash.section.indexOf('project-') === 0) {
        if (!viewer.root.open) openViewerById(hash.section);
        return;
      }
      if (hash.section !== 'projects') return;
      var known = hash.category === ALL || state.projects.some(function (project) {
        return project.category === hash.category;
      });
      applyFilter(known ? hash.category : ALL);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
