'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const nodes = new Map();
function node() {
  return {
    children: [], events: {}, attributes: {}, textContent: '',
    setAttribute(key, value) { this.attributes[key] = value; },
    removeAttribute(key) { delete this.attributes[key]; },
    addEventListener(type, callback) { this.events[type] = callback; },
    append(...children) { this.children.push(...children); },
    replaceChildren(fragment) { this.children = fragment.children; },
    getBoundingClientRect() { return { bottom: this.bottom ?? 60 }; },
    contains(target) { return this === target; },
    querySelectorAll() {
      return this.children.flatMap(child => child.children).filter(child => child.checked);
    },
    focus() { this.focused = true; },
    scrollIntoView() { this.scrolled = true; }
  };
}
const document = {
  getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
  createElement: node,
  createDocumentFragment: node
};
let mobile = false;
const events = {};
const frames = [];
const bank = [1, 2, 3, 4, 5, 6].flatMap(exam => require(`../assets/data/aws-cloud-practitioner/practice-${exam}.json`).questions);
vm.runInNewContext(fs.readFileSync(require.resolve('../assets/js/aws-test-yourself.js'), 'utf8'), {
  document,
  window: { addEventListener(type, callback) { events[type] = callback; }, matchMedia: () => ({ matches: mobile }) },
  requestAnimationFrame(callback) { frames.push(callback); },
  loadAwsQuestionBanks: async () => [{ questions: bank }]
});
const questions = nodes.get('questions');
const tracker = nodes.get('question-tracker');
const navigation = nodes.get('question-navigation');
navigation.parentElement = node();
function scroll() { events.scroll(); frames.shift()(); }
async function main() {
  scroll();
  assert.equal(tracker.textContent, '');
  document.getElementById('question-count').value = '10';
  const generate = nodes.get('generate-form').events.submit;
  await generate({ preventDefault() {} });
  assert.equal(tracker.textContent, 'Question 1 of 10');
  assert.equal(navigation.children.length, 10);
  assert.ok(navigation.children.every(button => button.type === 'button'));
  assert.ok(navigation.children.every(button => button.attributes['aria-label'].endsWith(', unanswered')));
  questions.children.forEach((fieldset, index) => {
    const choices = fieldset.children.filter(child => child.className === 'choice').map(label => label.children[0]);
    const required = Number(fieldset.children[1].textContent.match(/Select (\d+)/)[1]);
    const button = navigation.children[index];
    // Exercise empty, partial, complete, and excessive selections, then clear again.
    for (const count of [...Array(choices.length + 1).keys(), 0, required]) {
      choices.forEach((choice, number) => { choice.checked = number < count; });
      fieldset.events.change();
      const answered = count === required;
      assert.equal(button.textContent, `${index + 1}${answered ? ' ✓' : count ? ' −' : ''}`);
      assert.equal(button.attributes['data-answered'], String(answered));
      const state = answered ? 'answered' : count ? 'incomplete' : 'unanswered';
      assert.equal(button.attributes['aria-label'], `Go to question ${index + 1}, ${state}, ${count} of ${required} answers selected`);
    }
  });
  assert.equal(navigation.children[0].attributes['aria-current'], 'step');
  navigation.children[6].events.click();
  assert.ok(questions.children[6].focused && questions.children[6].scrolled);
  assert.equal(navigation.children[6].attributes['aria-controls'], questions.children[6].id);
  assert.equal(navigation.children[6].attributes['aria-current'], 'step');
  assert.equal(tracker.textContent, 'Question 7 of 10');
  questions.children.forEach((question, index) => { question.bottom = index < 4 ? -10 : 400; });
  scroll();
  assert.equal(tracker.textContent, 'Question 5 of 10');
  assert.equal(navigation.children[4].attributes['aria-current'], 'step');
  assert.equal(navigation.children.filter(button => button.attributes['aria-current']).length, 1);
  mobile = true;
  questions.children[4].bottom = 70;
  scroll();
  assert.equal(tracker.textContent, 'Question 6 of 10');
  questions.events.focusin({ target: questions.children[7] });
  assert.equal(tracker.textContent, 'Question 8 of 10');
  questions.children.forEach(question => { question.bottom = -10; });
  events.resize(); frames.shift()();
  assert.equal(tracker.textContent, 'Question 10 of 10');
  document.getElementById('question-count').value = '25';
  await generate({ preventDefault() {} });
  assert.equal(tracker.textContent, 'Question 1 of 25');
  assert.equal(navigation.children.length, 25);
  assert.ok(navigation.children.every(button => button.attributes['data-answered'] !== 'true'));
  assert.ok(navigation.children.every(button => button.attributes['aria-label'].endsWith(', unanswered')));
  assert.equal(navigation.children[0].attributes['aria-current'], 'step');
  navigation.children[24].events.click();
  assert.equal(tracker.textContent, 'Question 25 of 25');
  assert.ok(questions.children[24].scrolled);
  assert.equal(nodes.get('test-form').hidden, false);
  console.log('Passed: empty/partial/exact/excessive selections, reset answer state, sidebar jump buttons, exclusive highlight, desktop/mobile scrolling, keyboard focus, resize, and regeneration.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
