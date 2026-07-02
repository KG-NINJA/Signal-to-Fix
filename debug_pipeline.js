const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

// Mock browser environment
const createMockElement = (id) => ({
    id,
    value: id === 'productName' ? 'Signal-to-Fix' : (id === 'targetArea' ? 'onboarding' : ''),
    addEventListener: () => {},
    textContent: '',
    className: '',
    innerHTML: '',
    style: {}
});

const document = {
    getElementById: (id) => createMockElement(id)
};
const window = { localStorage: { getItem: () => null, setItem: () => {} }, isSecureContext: true };
const navigator = { clipboard: { writeText: () => {} } };
const $ = (id) => document.getElementById(id);

let state = { results: [], clusters: [], ranking: [], prompt: "" };

// Remove everything from addEventListener onwards to avoid execution errors
let cleanCode = content.split("elements.analyzeBtn.addEventListener")[0];

cleanCode = cleanCode.replace(/const elements = \{[\s\S]*?\};/g, `
const elements = {
  productName: $('productName'),
  productUrl: $('productUrl'),
  targetArea: $('targetArea'),
  feedbackInput: $('feedbackInput'),
  statusMessage: {},
  summaryText: {},
  promptOutput: {},
  resultsSummary: {},
  priorityRanking: {},
  issueClusters: {},
  resultsList: {},
  prSpecSection: {},
  implPromptSection: {},
  summaryText: {}
};
`);
cleanCode = cleanCode.replace(/const \$ = \(id\) => document\.getElementById\(id\);/g, '');
cleanCode = cleanCode.replace(/const state = \{[\s\S]*?\};/g, '');

try {
    eval(cleanCode);

    const samplePosts = [
        'Signal-to-Fix crashes every time I paste 20 lines on iOS. Screenshot attached.',
        'The onboarding is kind of confusing and hard to use, not sure what to click after import.',
        'Pricing feels expensive and I cannot find how to cancel or get a refund.',
        'Please add JSON export for only kept issues so I can hand it to Codex.',
        'Love this idea, super useful for cleaning up feedback.',
        'GM giveaway airdrop 100x game changer bookmark this #crypto #airdrop #free #wagmi #promo 🚀🚀🚀🚀🚀',
        '日本語UIが使いにくい。ログインできない時のエラーもわかりにくいので対応してほしい。'
    ];

    state.results = samplePosts.map((p, i) => analyzePost(p, i));

    console.log('--- Step 1: analyzePost Analysis ---');
    state.results.forEach((r, i) => {
        if (i === 5) {
            console.log('Spam sample analysis:');
            console.log(`  Original: ${r.originalPost}`);
            console.log(`  Decision: ${r.decision}`);
            console.log(`  Type: ${r.type}`);
            console.log(`  Reasons: ${JSON.stringify(r.reasons)}`);
            const text = r.originalPost.toLowerCase();
            console.log(`  includesAny(text, RULES.noise): ${includesAny(text, RULES.noise)}`);
            console.log(`  hasExcessiveHashtags(post): ${hasExcessiveHashtags(r.originalPost)}`);
            console.log(`  hasExcessiveEmojis(post): ${hasExcessiveEmojis(r.originalPost)}`);
        }
    });

    console.log('\n--- Step 2: getIssueClusters Analysis ---');
    state.clusters = getIssueClusters();
    console.log('Clusters count:', state.clusters.length);
    if (state.clusters.length === 0) {
        console.log('REASON FOR EMPTY CLUSTERS:');
        state.results.forEach(item => {
            console.log(`  Item ID ${item.id}: decision=${item.decision}, type=${item.type}`);
        });
    }

} catch (e) {
    console.log('ERROR during execution:');
    console.log(e);
}
