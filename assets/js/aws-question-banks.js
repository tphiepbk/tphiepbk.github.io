'use strict';

async function loadAwsQuestionBanks() {
  const ids = new Set();
  // shortcut: four CLF-C02 banks; use a certificate catalog when adding other certificates.
  return Promise.all([1, 2, 3, 4].map(async exam => {
    const response = await fetch(`../assets/data/aws-cloud-practitioner/practice-${exam}.json`);
    if (!response.ok) throw new Error(`Bank ${exam} returned HTTP ${response.status}.`);
    const bank = await response.json();
    if (bank.certification?.examCode !== 'CLF-C02' || !Array.isArray(bank.questions) || !bank.questions.length) {
      throw new Error(`Invalid question bank ${exam}.`);
    }
    for (const question of bank.questions) {
      if (typeof question.id !== 'string' || !/^\d+-\d+$/.test(question.id) || ids.has(question.id)
        || !['prompt', 'explanation', 'domain'].every(key => typeof question[key] === 'string' && question[key].trim())
        || !Array.isArray(question.options) || question.options.length < 2
        || !question.options.every(option => typeof option === 'string' && option.trim())
        || !Array.isArray(question.correct) || !question.correct.length
        || question.correct.length >= question.options.length
        || new Set(question.correct).size !== question.correct.length
        || !question.correct.every(index => Number.isInteger(index) && index >= 0 && index < question.options.length)) {
        throw new Error(`Invalid question in bank ${exam}.`);
      }
      ids.add(question.id);
    }
    return bank;
  }));
}

if (typeof module !== 'undefined') module.exports = { loadAwsQuestionBanks };
