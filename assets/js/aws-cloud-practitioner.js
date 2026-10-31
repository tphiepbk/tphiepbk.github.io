'use strict';
document.documentElement.classList.add('js');
const cards = [...document.querySelectorAll('.question')];
const domains = [...document.querySelectorAll('.domain')];
const buttons = [...document.querySelectorAll('button[data-category]')];
const search = document.getElementById('search');
const exam = document.getElementById('exam');
const results = document.getElementById('results');
const searchable = cards.map(card => (card.id + ' ' + card.textContent).toLowerCase());
let category = '';

function applyFilters() {
  const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let total = 0;
  cards.forEach((card, i) => {
    const visible = (!category || card.dataset.category === category)
      && (!exam.value || card.dataset.exam === exam.value)
      && words.every(word => searchable[i].includes(word));
    card.hidden = !visible;
    if (visible) total++;
  });
  domains.forEach(domain => {
    const count = [...domain.querySelectorAll('.question')].filter(card => !card.hidden).length;
    domain.hidden = count === 0;
    domain.querySelector('.count').textContent = `${count} question${count === 1 ? '' : 's'}`;
  });
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
  results.textContent = `Showing ${total.toLocaleString()} of ${cards.length.toLocaleString()} questions.`;
  document.getElementById('empty').hidden = total !== 0;
}
buttons.forEach(button => button.addEventListener('click', () => {
  category = button.dataset.category;
  applyFilters();
}));
search.addEventListener('input', applyFilters);
exam.addEventListener('change', applyFilters);
document.getElementById('reset').addEventListener('click', () => {
  category = '';
  search.value = '';
  exam.value = '';
  applyFilters();
});
