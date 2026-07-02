const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

const ONBOARDING_HELP_TERMS = [
  'what to paste', "don't understand", 'dont understand', 'confusing', 'when to use',
  'how to use', 'where to use', 'getting started', 'first use', 'guide', 'instructions',
  '使い方', '何を貼る', 'わからない', '分からない', '迷う', 'どこで使う',
  'どこで使え', 'いつ使う', 'ガイド', '説明', '初回', '最初'
];

const rulesMatch = content.match(/const RULES = ([\s\S]*?);/);
const RULES = eval("(" + rulesMatch[1] + ")");

const spam = "GM giveaway airdrop 100x game changer bookmark this #crypto #airdrop #free #wagmi #promo 🚀🚀🚀🚀🚀";
const text = spam.toLowerCase();

console.log("Searching for matches in spam...");
for (const [group, terms] of Object.entries(RULES.types)) {
    terms.forEach(t => {
        if (text.includes(t.toLowerCase())) {
            console.log(`Match in RULES.types.${group}: "${t}"`);
        }
    });
}
for (const t of RULES.useful) {
    if (text.includes(t.toLowerCase())) {
        console.log(`Match in RULES.useful: "${t}"`);
    }
}
