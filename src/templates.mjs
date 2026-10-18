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
    ? '<p class="sample-hint">带“示例”标记的文章为占位内容。</p>' : '';

  function noteRow(item) {
    return `<article class="note-row" data-post data-post-category="${escape(item.category)}" data-search="${escape([item.title, item.summary, item.category, ...item.tags, item.plainText].join(' '))}">
      <time class="note-date" datetime="${escape(item.date)}">${dateLabel(item.date)}</time>
      <div class="note-content"><h3><a href="${escape(item.url)}">${escape(item.title)}</a></h3>
        ${item.summary ? `<p class="note-summary">${escape(item.summary)}</p>` : ''}
        <div class="note-meta"><a href="${categoryUrl(item.category)}">${escape(item.category)}</a>${item.sample ? '<span>示例</span>' : ''}</div>
      </div>
    </article>`;
  }
  function heading(title, description, label = '') {
    return `<header class="page-heading"><h1>${escape(title)}</h1>${description ? `<p>${escape(description)}</p>` : ''}</header>`;
  }
  function searchBox() {
    return '<div class="search-bar"><label class="sr-only" for="post-search">搜索记录</label><input id="post-search" data-search-input type="search" placeholder="搜索记录…" autocomplete="off"></div>';
  }

  let content = '';
  if (page === 'home') {
    content = `<section class="home-intro" aria-labelledby="intro-title"><p class="terminal-path"><span aria-hidden="true">&gt;</span> ~/humanoid-robotics</p><h1 id="intro-title">学习<span class="intro-divider"> / </span>记录<span class="intro-divider"> / </span>迭代<span class="terminal-cursor" aria-hidden="true"></span></h1><p class="intro-description">我的人形机器人学习日志。<br>记下理解、实验，以及还没有解决的问题。</p></section><div class="section-heading"><h2><span class="section-marker" aria-hidden="true">//</span> 最近记录 <span class="entry-count">${String(posts.length).padStart(2, '0')}</span></h2><a href="${href('/posts/')}">查看归档 <span aria-hidden="true">↗</span></a></div>${sampleNotice(posts)}<div class="note-list">${posts.slice(0, 10).map(noteRow).join('') || '<p class="empty-state">还没有记录。</p>'}</div>`;
  } else if (page === 'posts' || page === 'category') {
    const items = page === 'category' ? posts.filter(item => item.category === category.title) : posts;
    content = `${heading(page === 'category' ? category.title : '全部记录', page === 'category' ? category.description : '按时间整理的个人笔记，保留每个阶段的问题与思考。', page === 'category' ? '栏目' : '归档')}
      <section aria-label="记录列表">${page === 'posts' ? searchBox() : ''}<p class="result-count" data-result-count aria-live="polite">${items.length} 篇记录</p>
      ${sampleNotice(items)}<div class="note-list">${items.map(noteRow).join('')}</div><p data-empty ${items.length ? 'hidden' : ''} class="empty-state">${items.length ? '没有匹配的记录。' : '这个栏目还没有记录。'}</p></section>`;
  } else if (page === 'about') {
    content = `${heading('关于这份学习记录', '人形机器人领域的个人学习笔记。', config.author)}
      <div class="about-prose prose"><h2>记录自己的学习过程</h2><p>我想在这里留下学习人形机器人时的过程：一个概念是怎样理解的，一篇论文为什么值得记住，一个问题又是怎样被定位和解决的。</p><p>笔记会带有当时的背景、疑问和局限。有些结论还需要验证，有些想法以后也可能改变，更新和修正同样属于记录的一部分。</p><h2>目前的四个栏目</h2><dl class="about-columns">${categories.map(item => `<div><dt><a href="${href(categoryPath(item))}">${escape(item.title)}</a></dt><dd>${escape(item.description)}</dd></div>`).join('')}</dl><h2>保留上下文，方便以后回看</h2><p>基础笔记里保留推导与疑问，文献记录里保留出处与个人批注，debug 记录里保留环境、报错和排查过程。观点闲谈则留给那些暂时还没有形成完整结论的想法。</p>${sampleNotice(posts)}${github ? `<p><a href="${github}" target="_blank" rel="noopener noreferrer">GitHub · ${escape(config.github)}</a></p>` : ''}</div>`;
  } else if (page === 'post') {
    content = `<a class="back-link" href="${categoryUrl(post.category)}">← ${escape(post.category)}</a><header class="article-heading"><h1>${escape(post.title)}</h1><div class="article-meta"><time datetime="${escape(post.date)}">${dateLabel(post.date)}</time>${post.sample ? '<span class="sample-badge">示例</span>' : ''}</div></header>
      ${toc.length ? `<details class="toc"><summary>目录</summary><nav>${toc.map(item => `<a class="toc-level-${item.level}" href="#${escape(item.id)}">${escape(item.text)}</a>`).join('')}</nav></details>` : ''}<article class="prose" id="article-body">${post.sample ? '<aside class="sample-notice">这篇文章为写作示例，尚未替换为我的实际学习记录。</aside>' : ''}${body}<div class="article-tags">${post.tags.map(tag => `<span># ${escape(tag)}</span>`).join('')}</div></article>`;
  } else if (page === 'roadmap') {
    content = `${heading('学习计划', '')}<div class="prose plan-prose">${(roadmap.phases || []).length ? roadmap.phases.map(phase => `<section id="${escape(phase.id)}"><h2>${escape(phase.title)}</h2><p>${escape(phase.description)}</p><ul>${phase.topics.map(topic => `<li>${escape(topic)}</li>`).join('')}</ul></section>`).join('') : '<p>暂时还没有学习计划。</p>'}</div>`;
  } else {
    content = `${heading('页面未找到', '这个地址暂时没有内容。', '404')}<p><a class="text-link" href="${href('/')}">返回首页 →</a></p>`;
  }

  const navLink = (label, url, selected) => `<a href="${url}"${selected ? ' class="active" aria-current="page"' : ''}>${escape(label)}</a>`;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><meta name="theme-color" content="#101512"><title>${escape(page === 'home' ? `${config.title} — 我的人形机器人学习记录` : `${title} · ${config.title}`)}</title><meta name="description" content="${escape(description)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="${page === 'post' ? 'article' : 'website'}">${canonical ? `<link rel="canonical" href="${escape(canonical)}"><meta property="og:url" content="${escape(canonical)}">` : ''}<link rel="icon" href="${href('/assets/favicon.svg') + '?v=' + encodeURIComponent(config.assetVersion || '1')}" type="image/svg+xml"><link rel="alternate" type="application/rss+xml" title="${escape(config.title)}" href="${href('/rss.xml')}"><link rel="stylesheet" href="${href('/assets/style.css') + '?v=' + encodeURIComponent(config.assetVersion || '1')}"><script type="module" src="${href('/assets/main.js') + '?v=' + encodeURIComponent(config.assetVersion || '1')}"></script></head><body><a class="skip-link" href="#main">跳到主要内容</a>
    <header class="site-header"><div class="header-line"><a class="brand" href="${href('/')}"><span class="brand-prompt" aria-hidden="true">&gt;_</span> ${escape(config.title)}</a><span class="header-label">PERSONAL LEARNING LOG</span></div><p class="site-description">人形机器人学习记录</p>
    <nav class="site-nav" aria-label="主导航">${navLink('全部', href('/posts/'), page === 'home' || page === 'posts')}${categories.map(item => navLink(item.title, href(categoryPath(item)), selectedCategory === item.title)).join('')}</nav></header>
    <main id="main" class="main-content page-${page}">${content}</main><footer class="site-footer"><span>© ${new Date().getFullYear()} ${escape(config.author)}</span><nav aria-label="页脚导航"><a href="${href('/about/')}">关于</a><a href="${href('/rss.xml')}">RSS</a>${github ? `<a href="${github}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}${config.repoUrl ? `<a href="${escape(config.repoUrl)}/blob/main/WRITING.md">写作指南</a>` : ''}</nav></footer></body></html>`;
}
