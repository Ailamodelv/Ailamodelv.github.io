const search = document.querySelector('[data-search-input]');
const cards = [...document.querySelectorAll('[data-post]')];
const empty = document.querySelector('[data-empty]');
const count = document.querySelector('[data-result-count]');
function filterPosts() {
  const query = (search?.value || '').normalize('NFKC').trim().toLocaleLowerCase('zh-CN');
  let visible = 0;
  cards.forEach(card => {
    const matches = !query || card.dataset.search.normalize('NFKC').toLocaleLowerCase('zh-CN').includes(query);
    card.hidden = !matches;
    if (matches) visible++;
  });
  if (empty) empty.hidden = visible !== 0;
  if (count) count.textContent = `${visible} 篇记录`;
}
search?.addEventListener('input', filterPosts);

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
