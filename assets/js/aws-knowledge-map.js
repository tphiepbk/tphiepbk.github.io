(() => {
  const search = document.querySelector('#topic-search');
  const sections = [...document.querySelectorAll('.study-section')];
  const notes = [...document.querySelectorAll('.topic')];
  const navigation = [...document.querySelectorAll('.contents nav a')];
  const expand = document.querySelector('#expand-notes');
  const status = document.querySelector('#search-status');
  const searchable = sections.map(section => section.textContent.toLowerCase());
  let expanded = false;

  function filterSections() {
    const query = search.value.trim().toLowerCase();
    let count = 0;
    sections.forEach((section, index) => {
      const matches = searchable[index].includes(query);
      section.hidden = !matches;
      navigation[index].parentElement.hidden = !matches;
      if (matches) count++;
      section.querySelectorAll('.topic').forEach(note => {
        note.open = expanded || (query !== '' && note.textContent.toLowerCase().includes(query));
      });
    });
    status.textContent = query ? `${count} of ${sections.length} sections match “${search.value.trim()}”.` : `All ${sections.length} sections · ${notes.length} topic notes`;
    document.querySelector('#no-results').hidden = count !== 0;
  }

  function revealAnchor() {
    const target = sections.find(section => `#${section.id}` === location.hash);
    if (target?.hidden) {
      search.value = '';
      filterSections();
      target.scrollIntoView();
    }
  }

  search.addEventListener('input', filterSections);
  document.querySelector('#clear-search').addEventListener('click', () => {
    search.value = '';
    filterSections();
    search.focus();
  });
  expand.addEventListener('click', () => {
    expanded = !expanded;
    expand.textContent = expanded ? 'Collapse all notes' : 'Expand all notes';
    expand.setAttribute('aria-pressed', String(expanded));
    notes.forEach(note => { note.open = expanded; });
  });
  window.addEventListener('hashchange', revealAnchor);
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      const target = sections.find(section => `#${section.id}` === link.getAttribute('href'));
      if (target?.hidden) {
        search.value = '';
        filterSections();
      }
    });
  });
  document.querySelector('.study-controls').hidden = false;
  filterSections();
  revealAnchor();
})();
