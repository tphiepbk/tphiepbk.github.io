'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const control = (dataset = {}) => ({
  dataset, value: '', events: {}, attributes: {},
  addEventListener(event, callback) { this.events[event] = callback; },
  setAttribute(key, value) { this.attributes[key] = value; }
});
const cards = [
  { id: 'q-1-1', textContent: 'Amazon S3 explanation', dataset: { category: 'T', exam: '1' } },
  { id: 'q-2-1', textContent: 'Amazon S3 encryption', dataset: { category: 'S', exam: '2' } },
  { id: 'q-1-2', textContent: 'IAM security', dataset: { category: 'S', exam: '1' } }
];
const buttons = ['', 'T', 'S'].map(category => control({ category }));
const domains = ['T', 'S'].map(category => ({
  count: {},
  querySelectorAll: () => cards.filter(card => card.dataset.category === category),
  querySelector() { return this.count; }
}));
const controls = Object.fromEntries(['search', 'exam', 'results', 'empty', 'reset'].map(id => [id, control()]));
const document = {
  documentElement: { classList: { add() {} } },
  querySelector: () => null,
  querySelectorAll: selector => ({ '.question': cards, '.domain': domains, 'button[data-category]': buttons })[selector],
  getElementById: id => controls[id]
};
const context = vm.createContext({ document });
vm.runInContext(fs.readFileSync(require.resolve('../assets/js/aws-cloud-practitioner.js'), 'utf8'), context);
// Async pages initialize only after their cards exist.
assert.equal(controls.search.events.input, undefined);
context.initializeQuestionFilters();
assert.equal(controls.results.textContent, 'Showing 3 of 3 questions.');
controls.search.value = 'S3 encryption';
controls.search.events.input();
assert.deepEqual(cards.map(card => card.hidden), [true, false, true]);
controls.exam.value = '1';
controls.exam.events.change();
assert.equal(controls.empty.hidden, false);
controls.reset.events.click();
buttons[2].events.click();
assert.deepEqual(cards.map(card => card.hidden), [true, false, false]);
assert.equal(domains[0].hidden, true);
assert.equal(domains[1].count.textContent, '2 questions');
assert.equal(buttons[2].attributes['aria-pressed'], 'true');
controls.reset.events.click();
assert.ok(cards.every(card => !card.hidden));
assert.equal(controls.empty.hidden, true);
console.log('Passed: deferred initialization, search, exam/section filters, empty results, counts, and reset.');
