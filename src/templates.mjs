const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const dateLabel = date => String(date).slice(0, 10).replaceAll('-', '.');

export function renderPage({ page, config, posts = [], roadmap = {}, post, body = '', toc = [], category }) {
  const href = path => `${config.basePath || ''}${path}`;
  const categories = config.categories || [];
  const categoryPath = item => `/categories/${item.slug}/`;
  const categoryUrl = name => {
    const item = categories.find(item => item.title === name);
    return href(item ? categoryPath(item) : '/posts/');
  };
  const github = config.github ? `https://github.com/${encodeURIComponent(config.github)}` : '';
  const pageNames = { home: '首页', posts: '全部记录', about: '关于', roadmap: '学习计划', '404': '页面未找到' };
  const pagePaths = { home: '/', posts: '/posts/', about: '/about/', roadmap: '/roadmap/', '404': '/404.html' };
  const title = page === 'post' ? post.title : page === 'category' ? category.title : pageNames[page];
  const currentPath = page === 'post' ? post.url : href(page === 'category' ? categoryPath(category) : pagePaths[page]);
  const description = page === 'category' ? category.description : post?.summary || config.description;
  const canonical = config.url ? `${config.url}${currentPath}` : '';
  const selectedCategory = page === 'category' ? category.title : post?.category;
  const sampleNotice = items => items.some(item => item.sample)
    ? '<p class="sample-hint">标注“示例”的文章为建站时的占位内容，尚非我的实际学习经历。</p>' : '';

  function noteRow(item) {
    return `<article class="note-row" data-post data-post-category="${escape(item.category)}" data-search="${escape([item.title, item.summary, item.category, ...item.tags, item.plainText].join(' '))}">
      <div class="note-date"><time datetime="${escape(item.date)}">${dateLabel(item.date)}</time>${item.sample ? '<span class="sample-badge">示例</span>' : ''}</div>
      <div class="note-content"><a class="category-link" href="${categoryUrl(item.category)}">${escape(item.category)}</a>
        <h3><a href="${escape(item.url)}">${escape(item.title)}</a></h3><p>${escape(item.summary)}</p>
        <div class="note-tags">${item.tags.map(tag => `<span># ${escape(tag)}</span>`).join('')}<span class="reading-time">${item.readingTime} 分钟阅读</span></div>
      </div>
    </article>`;
  }
  function indexList() {
    return `<nav class="column-index" aria-label="栏目索引">${categories.map(item => {
      const count = posts.filter(post => post.category === item.title).length;
      return `<a href="${href(categoryPath(item))}"><div><strong>${escape(item.title)}</strong><span>${count} 篇</span></div><p>${escape(item.description)}</p></a>`;
    }).join('')}</nav>`;
  }
  function heading(title, description, label = '') {
    return `<header class="page-heading">${label ? `<p class="page-label">${escape(label)}</p>` : ''}<h1>${escape(title)}</h1><p>${escape(description)}</p></header>`;
  }
  function searchBox() {
    return '<div class="search-bar"><label for="post-search">搜索记录</label><input id="post-search" data-search-input type="search" placeholder="标题、标签或正文" autocomplete="off"></div>';
  }

  let content = '';
  if (page === 'home') {
    content = `<section class="intro"><p class="page-label">${escape(config.author)} / 个人学习记录</p><h1>我的人形机器人学习记录</h1><p>记下学到的知识、读过的文献、遇到的问题，<br class="desktop-break">以及学习过程中不断变化的想法，留给以后的自己回看。</p></section>
      <div class="home-layout"><section class="recent-notes"><div class="section-heading"><h2>最近记录</h2><a href="${href('/posts/')}">全部记录 <span aria-hidden="true">→</span></a></div>${sampleNotice(posts)}<div class="note-list">${posts.slice(0, 6).map(noteRow).join('') || '<p class="empty-state">还没有记录。</p>'}</div></section>
      <aside class="home-aside"><h2>栏目</h2>${indexList()}<div class="aside-note"><h2>关于这份记录</h2><p>以当时的问题和理解为起点，保留推导、尝试、错误与修正。内容会随着学习继续补充。</p><a href="${href('/about/')}">关于这个博客 →</a></div></aside></div>`;
  } else if (page === 'posts' || page === 'category') {
    const items = page === 'category' ? posts.filter(item => item.category === category.title) : posts;
    const filterNames = ['全部', ...new Set([...categories.map(item => item.title), ...posts.map(item => item.category)])];
    content = `${heading(page === 'category' ? category.title : '全部记录', page === 'category' ? category.description : '按时间整理的个人笔记，保留每个阶段的问题与思考。', page === 'category' ? '栏目' : '归档')}
      <section aria-label="记录列表">${searchBox()}<div class="filter-row">${page === 'posts' ? `<div class="filters" role="group" aria-label="按栏目筛选">${filterNames.map((name, index) => `<button type="button" data-category="${escape(name)}" class="filter ${index === 0 ? 'selected' : ''}" aria-pressed="${index === 0}">${escape(name)}</button>`).join('')}</div>` : `<a class="back-link" href="${href('/posts/')}">← 全部记录</a>`}<span data-result-count aria-live="polite">${items.length} 篇记录</span></div>
      ${sampleNotice(items)}<div class="note-list">${items.map(noteRow).join('')}</div><p data-empty ${items.length ? 'hidden' : ''} class="empty-state">${items.length ? '没有匹配的记录，试试其他关键词或栏目。' : '这个栏目还没有记录。'}</p><noscript><p class="sample-hint">搜索和筛选需要 JavaScript；也可通过顶部栏目导航直接浏览。</p></noscript></section>`;
  } else if (page === 'about') {
    content = `${heading('关于这份学习记录', '人形机器人领域的个人学习笔记。', config.author)}
      <div class="about-prose prose"><h2>记录自己的学习过程</h2><p>我想在这里留下学习人形机器人时的过程：一个概念是怎样理解的，一篇论文为什么值得记住，一个问题又是怎样被定位和解决的。</p><p>笔记会带有当时的背景、疑问和局限。有些结论还需要验证，有些想法以后也可能改变，更新和修正同样属于记录的一部分。</p><h2>目前的四个栏目</h2><dl class="about-columns">${categories.map(item => `<div><dt><a href="${href(categoryPath(item))}">${escape(item.title)}</a></dt><dd>${escape(item.description)}</dd></div>`).join('')}</dl><h2>保留上下文，方便以后回看</h2><p>基础笔记里保留推导与疑问，文献记录里保留出处与个人批注，debug 记录里保留环境、报错和排查过程。观点闲谈则留给那些暂时还没有形成完整结论的想法。</p>${sampleNotice(posts)}${github ? `<p><a href="${github}" target="_blank" rel="noopener noreferrer">GitHub · ${escape(config.github)}</a></p>` : ''}</div>`;
  } else if (page === 'post') {
    const related = posts.filter(item => item.slug !== post.slug && item.category === post.category).slice(0, 2);
    content = `<a class="back-link article-back" href="${categoryUrl(post.category)}">← ${escape(post.category)}</a><header class="article-heading"><div class="article-meta"><time datetime="${escape(post.date)}">${dateLabel(post.date)}</time><span>${escape(config.author)}</span><span>${post.readingTime} 分钟阅读</span>${post.sample ? '<span class="sample-badge">示例</span>' : ''}</div><h1>${escape(post.title)}</h1><p>${escape(post.summary)}</p></header>
      <div class="article-layout"><article class="prose" id="article-body">${post.sample ? '<aside class="sample-notice">这篇文章为建站时的写作示例，尚未替换为我的实际学习记录。</aside>' : ''}${body}<div class="article-tags">${post.tags.map(tag => `<span># ${escape(tag)}</span>`).join('')}</div></article>${toc.length ? `<aside class="toc" aria-label="文章目录"><strong>本文目录</strong><nav>${toc.map(item => `<a class="toc-level-${item.level}" href="#${escape(item.id)}">${escape(item.text)}</a>`).join('')}</nav></aside>` : ''}</div>
      ${related.length ? `<section class="related-section"><div class="section-heading"><h2>同栏目记录</h2><a href="${categoryUrl(post.category)}">查看栏目 →</a></div>${related.map(noteRow).join('')}</section>` : ''}`;
  } else if (page === 'roadmap') {
    content = `${heading('学习计划', '保留建站时的计划草稿，后续可随个人学习情况调整。', '计划草稿')}<div class="prose plan-prose"><p class="sample-notice">以下为初始计划示例，尚非实际学习进度。后续的阶段复盘可记录在“观点闲谈”栏目。</p>${(roadmap.phases || []).map(phase => `<section id="${escape(phase.id)}"><h2>${escape(phase.title)}</h2><p>${escape(phase.description)}</p><ul>${phase.topics.map(topic => `<li>${escape(topic)}</li>`).join('')}</ul></section>`).join('')}</div>`;
  } else {
    content = `${heading('页面未找到', '这个地址暂时没有内容。', '404')}<p><a class="text-link" href="${href('/')}">返回首页 →</a></p>`;
  }

  const navLink = (label, url, selected) => `<a href="${url}"${selected ? ' class="active" aria-current="page"' : ''}>${escape(label)}</a>`;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escape(page === 'home' ? `${config.title} — 我的人形机器人学习记录` : `${title} · ${config.title}`)}</title><meta name="description" content="${escape(description)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="${page === 'post' ? 'article' : 'website'}">${canonical ? `<link rel="canonical" href="${escape(canonical)}"><meta property="og:url" content="${escape(canonical)}">` : ''}<link rel="icon" href="${href('/assets/favicon.svg')}" type="image/svg+xml"><link rel="alternate" type="application/rss+xml" title="${escape(config.title)}" href="${href('/rss.xml')}"><link rel="stylesheet" href="${href('/assets/style.css')}"><script type="module" src="${href('/assets/main.js')}"></script></head><body><a class="skip-link" href="#main">跳到主要内容</a>
    <header class="site-header"><div class="header-top"><a class="brand" href="${href('/')}"><span class="brand-mark" aria-hidden="true">记</span><span>${escape(config.title)}</span></a><span class="site-subtitle">人形机器人 · 个人学习笔记</span><button class="menu-button" data-menu type="button" aria-expanded="false" aria-controls="site-navigation">栏目 <span aria-hidden="true">☰</span></button></div>
    <nav class="site-nav" id="site-navigation" aria-label="主导航">${navLink('首页', href('/'), page === 'home')}${categories.map(item => navLink(item.title, href(categoryPath(item)), selectedCategory === item.title)).join('')}<span class="nav-spacer"></span>${navLink('归档', href('/posts/'), page === 'posts')}${navLink('关于', href('/about/'), page === 'about')}</nav></header>
    <main id="main" class="main-content page-${page}">${content}</main><footer class="site-footer"><span>© ${new Date().getFullYear()} ${escape(config.author)} · ${escape(config.title)}</span><div><a href="${href('/rss.xml')}">RSS</a>${github ? `<a href="${github}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}</div></footer></body></html>`;
}
