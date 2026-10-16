document.documentElement.classList.add('js-enabled');
const menu = document.querySelector('[data-menu]');
const sidebar = document.querySelector('.site-nav');
menu?.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!expanded));
  sidebar?.classList.toggle('is-open', !expanded);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    menu?.setAttribute('aria-expanded', 'false');
    sidebar?.classList.remove('is-open');
  }
});

const search = document.querySelector('[data-search-input]');
const filters = [...document.querySelectorAll('[data-category]')];
const cards = [...document.querySelectorAll('[data-post]')];
const empty = document.querySelector('[data-empty]');
const count = document.querySelector('[data-result-count]');
let category = '全部';
function filterPosts() {
  const query = (search?.value || '').normalize('NFKC').trim().toLocaleLowerCase('zh-CN');
  let visible = 0;
  cards.forEach(card => {
    const matches = (category === '全部' || card.dataset.postCategory === category)
      && (!query || card.dataset.search.normalize('NFKC').toLocaleLowerCase('zh-CN').includes(query));
    card.hidden = !matches;
    if (matches) visible++;
  });
  if (empty) empty.hidden = visible !== 0;
  if (count) count.textContent = `${visible} 篇记录`;
}
search?.addEventListener('input', filterPosts);
filters.forEach(button => button.addEventListener('click', () => {
  category = button.dataset.category;
  filters.forEach(item => {
    const selected = item === button;
    item.classList.toggle('selected', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  filterPosts();
}));

document.querySelectorAll('pre').forEach(pre => {
  const button = document.createElement('button');
  button.className = 'copy-code';
  button.type = 'button';
  button.textContent = '复制';
  button.setAttribute('aria-label', '复制代码');
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pre.querySelector('code')?.textContent || '');
      button.textContent = '已复制';
    } catch {
      button.textContent = '请选中后复制';
    }
    setTimeout(() => { button.textContent = '复制'; }, 2000);
  });
  pre.append(button);
});
