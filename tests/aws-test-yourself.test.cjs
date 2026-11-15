'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { sampleQuestions, isCorrect } = require('../assets/js/aws-test-yourself.js');

const { parseBank } = require('./parse-aws-bank.cjs');

const bank = [1, 2, 3].flatMap(exam => {
  const { questions } = JSON.parse(fs.readFileSync(path.join(__dirname, `../assets/data/aws-cloud-practitioner/practice-${exam}.json`), 'utf8'));
  assert.equal(questions.length, 65);
  for (const question of questions) {
    assert.ok(question.explanation.length > 0);
    assert.ok(isCorrect(question, [...question.correct].reverse()));
    assert.equal(isCorrect(question, []), false);
    assert.equal(isCorrect(question, question.options.map((_, i) => i)), false);
    if (question.correct.length > 1) assert.equal(isCorrect(question, question.correct.slice(1)), false);
  }
  return questions;
});
assert.equal(bank.length, 195);
assert.deepEqual(bank[0].correct.map(i => bank[0].options[i]), [
  'Amazon Elastic Compute Cloud (Amazon EC2)',
  'Amazon DynamoDB',
  'Amazon Relational Database Service (Amazon RDS)'
]);
assert.deepEqual(bank[65].correct.map(i => bank[65].options[i]), ['Database encryption']);
assert.equal(isCorrect(bank[65], [0]), false);
const original = [...bank];
for (const count of [10, 25, 65]) {
  const sample = sampleQuestions(bank, count);
  assert.equal(sample.length, count);
  assert.equal(new Set(sample.map(question => question.id)).size, count);
}
assert.deepEqual(bank, original);
assert.throws(() => sampleQuestions(bank, 196));
assert.throws(() => sampleQuestions(bank, 0));
assert.throws(() => parseBank('<html>Missing file</html>', 1));
assert.throws(() => parseBank('Question 1\nCorrect\nPrompt\nOption A\nOption B', 1));
console.log('Passed: all 195 questions, answer keys, exact-match scoring, sampling, and invalid-bank checks.');
