'use strict';

function sampleQuestions(bank, count) {
  if (!Number.isInteger(count) || count < 1 || count > bank.length) throw new Error('Not enough questions for this test.');
  const quotas = [
    ['Cloud Concepts', 24],
    ['Security and Compliance', 30],
    ['Cloud Technology and Services', 34],
    ['Billing, Pricing, and Support', 12]
  ].map(([domain, percent]) => ({ domain, count: Math.floor(count * percent / 100), remainder: count * percent % 100 }));
  // Largest remainders receive the leftover seats; ties use the domain order above.
  const remaining = count - quotas.reduce((total, quota) => total + quota.count, 0);
  quotas.sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < remaining; i++) quotas[i].count++;
  for (const quota of quotas) {
    if (bank.filter(question => question.domain === quota.domain).length < quota.count) {
      throw new Error(`Not enough ${quota.domain} questions for this test.`);
    }
  }
  const available = new Map(quotas.map(quota => [quota.domain, quota.count]));
  const shuffled = [...bank];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.filter(question => {
    const needed = available.get(question.domain);
    if (!needed) return false;
    available.set(question.domain, needed - 1);
    return true;
  });
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
  const tracker = document.getElementById('question-tracker');
  const navigation = document.getElementById('question-navigation');
  let attempt = [];
  let trackingFrame = false;

  function trackQuestion(index) {
    const text = `Question ${index + 1} of ${questions.children.length}`;
    if (tracker.textContent !== text) tracker.textContent = text;
    [...navigation.children].forEach((button, number) => {
      if (number === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }

  function trackVisibleQuestion() {
    if (!questions.children.length) return;
    const top = window.matchMedia('(max-width:760px)').matches
      ? navigation.parentElement.getBoundingClientRect().bottom + 16 : 16;
    const index = [...questions.children].findIndex(question => question.getBoundingClientRect().bottom > top);
    trackQuestion(index === -1 ? questions.children.length - 1 : index);
  }

  function scheduleTracking() {
    if (trackingFrame) return;
    trackingFrame = true;
    requestAnimationFrame(() => {
      trackingFrame = false;
      trackVisibleQuestion();
    });
  }

  window.addEventListener('scroll', scheduleTracking, { passive: true });
  window.addEventListener('resize', scheduleTracking);
  questions.addEventListener('focusin', event => {
    const index = [...questions.children].findIndex(question => question.contains(event.target));
    if (index !== -1) trackQuestion(index);
  });

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
      const links = document.createDocumentFragment();
      next.forEach((question, index) => {
        const fieldset = document.createElement('fieldset');
        fieldset.id = `test-question-${index + 1}`;
        fieldset.tabIndex = -1;
        const jump = element('button', String(index + 1));
        jump.type = 'button';
        jump.setAttribute('aria-label', `Go to question ${index + 1}, unanswered`);
        jump.setAttribute('aria-controls', fieldset.id);
        fieldset.addEventListener('change', () => {
          const selected = fieldset.querySelectorAll('input:checked').length;
          const answered = selected === question.correct.length;
          jump.setAttribute('data-answered', String(answered));
          jump.textContent = `${index + 1}${answered ? ' ✓' : selected ? ' −' : ''}`;
          const state = answered ? 'answered' : selected ? 'incomplete' : 'unanswered';
          jump.setAttribute('aria-label', `Go to question ${index + 1}, ${state}, ${selected} of ${question.correct.length} answers selected`);
        });
        jump.addEventListener('click', () => {
          fieldset.focus({ preventScroll: true });
          fieldset.scrollIntoView({ block: 'start' });
          trackQuestion(index);
        });
        links.append(jump);
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
      navigation.replaceChildren(links);
      score.textContent = '';
      submit.disabled = false;
      form.hidden = false;
      trackQuestion(0);
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
