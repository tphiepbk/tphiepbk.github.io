'use strict';

function sampleQuestions(bank, count) {
  if (!Number.isInteger(count) || count < 1 || count > bank.length) throw new Error('Not enough questions for this test.');
  const shuffled = [...bank];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function isCorrect(question, selected) {
  return selected.length === question.correct.length && question.correct.every(index => selected.includes(index));
}

if (typeof module !== 'undefined') module.exports = { sampleQuestions, isCorrect };

if (typeof document !== 'undefined') {
  const generate = document.getElementById('generate');
  const status = document.getElementById('status');
  const form = document.getElementById('test-form');
  const questions = document.getElementById('questions');
  const score = document.getElementById('score');
  const submit = document.getElementById('submit-test');
  let attempt = [];

  function element(tag, text, className) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  document.getElementById('generate-form').addEventListener('submit', async event => {
    event.preventDefault();
    generate.disabled = true;
    status.textContent = 'Loading question banks…';
    try {
      const banks = await loadAwsQuestionBanks();
      const next = sampleQuestions(banks.flatMap(bank => bank.questions), Number(document.getElementById('question-count').value));
      const fragment = document.createDocumentFragment();
      next.forEach((question, index) => {
        const fieldset = document.createElement('fieldset');
        fieldset.append(element('legend', `${index + 1}. ${question.prompt}`));
        fieldset.append(element('p', `Select ${question.correct.length} answer${question.correct.length === 1 ? '' : 's'}.`));
        question.options.forEach((option, optionIndex) => {
          const label = element('label', '', 'choice');
          const input = document.createElement('input');
          input.type = question.correct.length === 1 ? 'radio' : 'checkbox';
          input.name = `question-${index}`;
          input.value = optionIndex;
          label.append(input, element('span', option));
          fieldset.append(label);
        });
        fragment.append(fieldset);
      });
      attempt = next;
      questions.replaceChildren(fragment);
      score.textContent = '';
      submit.disabled = false;
      form.hidden = false;
      status.textContent = `${attempt.length} questions ready. Answers stay hidden until you submit. Unanswered questions earn no points.`;
      document.getElementById('test-heading').focus();
    } catch (error) {
      status.textContent = `Could not generate a test. ${error.message} Check that the question bank files are available and try again. Your existing attempt has been kept.`;
    } finally {
      generate.disabled = false;
    }
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (submit.disabled) return;
    const data = new FormData(form);
    let points = 0;
    attempt.forEach((question, index) => {
      const selected = data.getAll(`question-${index}`).map(Number);
      const correct = isCorrect(question, selected);
      if (correct) points++;
      const fieldset = questions.children[index];
      fieldset.querySelectorAll('input').forEach(input => { input.disabled = true; });
      const review = element('div', '', 'answer-review');
      review.append(element('p', `${correct ? 'Correct' : selected.length ? 'Incorrect' : 'Unanswered'}. Correct answer${question.correct.length === 1 ? '' : 's'}: ${question.correct.map(i => question.options[i]).join('; ')}`));
      const details = document.createElement('details');
      details.append(element('summary', 'Explanation'), element('p', question.explanation));
      review.append(details);
      fieldset.append(review);
    });
    submit.disabled = true;
    score.textContent = `Your score: ${points} / ${attempt.length} (${Math.round(points / attempt.length * 100)}%). Review your answers below or generate another test.`;
    score.focus();
  });
}
