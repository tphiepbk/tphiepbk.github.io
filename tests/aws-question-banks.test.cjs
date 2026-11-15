'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadAwsQuestionBanks } = require('../assets/js/aws-question-banks.js');

async function main() {
  const fixtures = [1, 2, 3].map(exam => JSON.parse(fs.readFileSync(path.join(__dirname, `../assets/data/aws-cloud-practitioner/practice-${exam}.json`), 'utf8')));
  const originalFetch = global.fetch;
  const requested = [];
  let banks;
  function mockBanks() {
    banks = structuredClone(fixtures);
    global.fetch = async url => {
      requested.push(url);
      const exam = Number(url.match(/practice-(\d)\.json$/)[1]);
      return { ok: true, json: async () => banks[exam - 1] };
    };
  }
  try {
    mockBanks();
    const result = await loadAwsQuestionBanks();
    assert.equal(result.flatMap(bank => bank.questions).length, 195);
    assert.deepEqual(requested, [1, 2, 3].map(exam => `../assets/data/aws-cloud-practitioner/practice-${exam}.json`));
    for (const corrupt of [
      bank => { bank.certification.examCode = 'OTHER'; },
      bank => { bank.questions = []; },
      bank => { bank.questions[0].correct = [99]; },
      bank => { bank.questions[0].correct = [0, 0]; },
      bank => { bank.questions[0].options[0] = null; },
      bank => { bank.questions[0].domain = ''; },
      bank => { bank.questions[0].id = bank.questions[1].id; }
    ]) {
      mockBanks();
      corrupt(banks[0]);
      await assert.rejects(loadAwsQuestionBanks(), /Invalid question/);
    }
    global.fetch = async () => ({ ok: false, status: 404 });
    await assert.rejects(loadAwsQuestionBanks(), /HTTP 404/);
    global.fetch = async () => ({ ok: true, json: async () => { throw new SyntaxError('Invalid JSON'); } });
    await assert.rejects(loadAwsQuestionBanks(), /Invalid JSON/);
    mockBanks();
    assert.equal((await loadAwsQuestionBanks()).length, 3);
  } finally {
    global.fetch = originalFetch;
  }
  console.log('Passed: JSON loading, validation, HTTP/JSON failures, and successful retry.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
