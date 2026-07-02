const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

const ONBOARDING_HELP_TERMS = [
  'what to paste', "don't understand", 'dont understand', 'confusing', 'when to use',
  'how to use', 'where to use', 'getting started', 'first use', 'guide', 'instructions',
  '使い方', '何を貼る', 'わからない', '分からない', '迷う', 'どこで使う',
  'どこで使え', 'いつ使う', 'ガイド', '説明', '初回', '最初'
];

// Extract RULES
const rulesMatch = content.match(/const RULES = ([\s\S]*?);/);
const RULES = eval("(" + rulesMatch[1] + ")");

const includesAny = (text, terms) => terms.some(t => {
    const match = text.includes(t.toLowerCase());
    if (match) console.log(`    MATCH: "${t}"`);
    return match;
});

const spam = "GM giveaway airdrop 100x game changer bookmark this #crypto #airdrop #free #wagmi #promo 🚀🚀🚀🚀🚀";
const text = spam.toLowerCase();

console.log("Checking UX complaint matches:");
includesAny(text, RULES.types['UX complaint']);

console.log("\nChecking noise matches:");
includesAny(text, RULES.noise);

console.log("\nChecking useful matches:");
includesAny(text, RULES.useful);
