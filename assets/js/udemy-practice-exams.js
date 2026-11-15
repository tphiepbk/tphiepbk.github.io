'use strict';

async function renderUdemyExams() {
  const status = document.getElementById('load-status');
  const retry = document.getElementById('retry-load');
  retry.hidden = true;
  status.textContent = 'Loading question banks…';
  try {
    const banks = await loadAwsQuestionBanks();
    const questions = banks.flatMap(bank => bank.questions);
    const categories = new Map([...document.querySelectorAll('.section-button')].map(button => [
      button.querySelector('strong').textContent, button.dataset.category
    ]));
    if (questions.some(question => !categories.has(question.domain))) throw new Error('Unknown study section in question bank.');

    function element(tag, text, className) {
      const node = document.createElement(tag);
      node.textContent = text;
      if (className) node.className = className;
      return node;
    }

    const fragment = document.createDocumentFragment();
    for (const [domain, category] of categories) {
      const group = questions.filter(question => question.domain === domain);
      const section = element('section', '', 'domain');
      section.dataset.domain = category;
      section.setAttribute('aria-labelledby', `heading-${category}`);
      const intro = element('div', '', 'domain-intro');
      const heading = element('h2', domain + ' ');
      heading.id = `heading-${category}`;
      heading.append(element('span', `${group.length} questions`, 'count'));
      intro.append(heading);
      section.append(intro);
      document.querySelector(`.section-button[data-category="${category}"] span`).textContent = `${group.length} questions`;
      group.forEach(question => {
        const [exam, number] = question.id.split('-');
        const card = element('article', '', 'question');
        card.id = `q-${question.id}`;
        card.dataset.category = category;
        card.dataset.exam = exam;
        card.setAttribute('aria-labelledby', `title-${question.id}`);
        const meta = element('div', '', 'meta');
        const anchor = element('a', `Exam ${exam} · Question ${number}`);
        anchor.href = `#${card.id}`;
        meta.append(anchor);
        const title = element('h3', question.prompt, 'copy');
        title.id = `title-${question.id}`;
        const options = element('ul', '', 'options');
        question.options.forEach((option, index) => {
          const correct = question.correct.includes(index);
          const item = element('li', '', correct ? 'correct' : '');
          const copy = element('span', option, 'copy');
          if (correct) copy.append(element('span', '✓ Answer', 'answer-mark'));
          item.append(element('span', `${String.fromCharCode(65 + index)}.`, 'letter'), copy);
          options.append(item);
        });
        const details = element('details', '', 'explanation-details');
        const explanation = element('div', '', 'explanation copy');
        // Keep source text as text nodes while preserving clickable reference URLs.
        question.explanation.split(/(https?:\/\/[^\s<>]+)/g).forEach(part => {
          if (/^https?:\/\//.test(part)) {
            const link = element('a', part);
            link.href = part;
            link.rel = 'noreferrer';
            explanation.append(link);
          } else explanation.append(document.createTextNode(part));
        });
        details.append(element('summary', 'Explanation and references'), explanation);
        card.append(meta, title, options, details);
        section.append(card);
      });
      const top = element('a', '↑ Back to top', 'top-link');
      top.href = '#top';
      section.append(top);
      fragment.append(section);
    }
    document.getElementById('question-bank').append(fragment);
    const stats = document.querySelectorAll('.stats b');
    [questions.length, banks.length, categories.size, questions.length].forEach((count, index) => { stats[index].textContent = count; });
    initializeQuestionFilters();
    status.hidden = true;
    if (location.hash.startsWith('#q-')) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch (error) {
    status.textContent = `Could not load questions. ${error.message} Please try again.`;
    retry.hidden = false;
  }
}

document.getElementById('retry-load').addEventListener('click', renderUdemyExams);
renderUdemyExams();
