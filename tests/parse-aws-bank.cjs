'use strict';

function parseBank(text, exam) {
  const blocks = text.replace(/\r/g, '').split(/^Question (\d+)\s*\n/gm);
  const questions = [];
  for (let i = 1; i < blocks.length; i += 2) {
    const parts = blocks[i + 1].split('\nOverall explanation\n');
    const lines = parts[0].split('\n').map(line => line.trim()).filter(Boolean);
    const state = lines.shift();
    let prompt = lines.shift();
    // shortcut: these exports end each prompt with a question mark; revisit for other export formats.
    while (prompt && !prompt.includes('?') && lines.length) prompt += '\n\n' + lines.shift();
    const options = [];
    const correct = [];
    let marker = '';
    for (const line of lines) {
      if (/^(Your (answer|selection) is (in)?correct|Correct answer|Correct selection)$/.test(line)) {
        if (marker) throw new Error('Unexpected answer markers.');
        marker = line;
      } else {
        if (marker === 'Correct answer' || marker === 'Correct selection' || /^Your .* is correct$/.test(marker)) correct.push(options.length);
        options.push(line);
        marker = '';
      }
    }
    if (!/^(Correct|Incorrect)$/.test(state) || !prompt || options.length < 2 || !correct.length || correct.length >= options.length || marker || parts.length !== 2) {
      throw new Error(`Cannot read bank ${exam}, question ${blocks[i]}.`);
    }
    questions.push({ id: `${exam}-${blocks[i]}`, prompt, options, correct, explanation: parts[1].split('\nDomain\n')[0].trim() });
  }
  if (!questions.length) throw new Error(`Question bank ${exam} is empty.`);
  return questions;
}

module.exports = { parseBank };
