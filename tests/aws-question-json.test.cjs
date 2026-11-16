'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseBank } = require('./parse-aws-bank.cjs');

const ids = new Set();
const multilinePrompts = {
  '1-30': ['Which migration strategy best aligns with this goal?', 4, [2]],
  '1-52': ['Which AWS database service is the right fit for this requirement?', 4, [0]],
  '1-59': ['Which of the following is the right technique for encrypting data as needed by the customer?', 4, [2]],
  '1-65': ['What will be the outcome on the overall bill once the credits are used? (Select two)', 5, [0, 2]],
  '2-47': ['Which AWS technology/service will provide the necessary low-latency access to the end-users?', 4, [2]],
  '2-58': ['Which tool/service will help you achieve this requirement?', 4, [1]],
  '3-43': ['Which AWS forum/service can be used for troubleshooting an issue or checking for a solution?', 4, [3]],
  '5-12': ['Which migration strategy is the most appropriate for this scenario?', 4, [2]],
  '5-26': ['Which AWS tool/service is an optimal fit for this requirement?', 4, [2]],
  '5-38': ['Which AWS service will help implement this requirement with the least effort?', 4, [1]],
  '6-4': ['Which of the below services are encrypted by default and need no user intervention to enable encryption?', 4, [3]],
  '6-63': ['Which service will you use to decouple this architecture, without any communication loss between the two systems?', 4, [3]]
};
for (const exam of [1, 2, 3, 4, 5, 6]) {
  const source = fs.readFileSync(path.join(__dirname, `../tmp/aws_practice_${exam}.txt`), 'utf8').replace(/\r/g, '');
  const bank = JSON.parse(fs.readFileSync(path.join(__dirname, `../assets/data/aws-cloud-practitioner/practice-${exam}.json`), 'utf8'));
  assert.equal(bank.certification.examCode, 'CLF-C02');
  assert.equal(bank.certification.name, 'AWS Certified Cloud Practitioner');
  assert.equal(bank.questions.length, 65);
  const original = parseBank(source, exam);
  const blocks = source.split(/^Question \d+\s*\n/gm).slice(1);
  bank.questions.forEach(({ domain, ...question }, index) => {
    assert.deepEqual(question, original[index]);
    assert.equal(domain, blocks[index].split('\nDomain\n')[1].trim());
    assert.ok(domain.length > 0);
    assert.ok(!ids.has(question.id));
    ids.add(question.id);
    assert.ok(question.prompt.includes('?'));
    assert.ok(question.options.every(option => !option.includes('?')));
    if (multilinePrompts[question.id]) {
      const [ending, optionCount, answers] = multilinePrompts[question.id];
      assert.ok(question.prompt.endsWith('\n\n' + ending));
      assert.equal(question.options.length, optionCount);
      assert.deepEqual(question.correct, answers);
    }
    // Answer keys are zero-based indexes into the options array.
    assert.ok(question.correct.every(answer => Number.isInteger(answer) && answer >= 0 && answer < question.options.length));
  });
}
assert.equal(ids.size, 390);
console.log('Passed: 390 unique JSON questions match the source prompts, options, answer keys, explanations, and domains.');
