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
    state.clusters = getIssueClusters();
    state.ranking = [...state.clusters].sort((a, b) => b.priorityScore - a.priorityScore || b.frequency - a.frequency);

    const topCluster = state.ranking[0];
    const spec = topCluster ? generatePRSpec(topCluster) : null;
    const implPrompt = spec ? generateImplementationPrompt(spec) : '';

    console.log('REGRESSION REPORT');
    console.log('KEEP items:', state.results.filter(r => r.decision === 'keep').length);
    console.log('Clusters generated:', state.clusters.length);
    console.log('Rankings generated:', state.ranking.length);
    console.log('PR Specs generated:', spec ? 1 : 0);
    console.log('Implementation Prompts generated:', implPrompt ? 1 : 0);

    const spam = state.results[5];
    console.log('\nSPAM SAMPLE OUTPUT');
    console.log(`Decision: ${spam.decision}`);
    console.log(`Type: ${spam.type}`);
    console.log(`Extracted Problem: ${spam.extractedProblem}`);
    console.log(`Suggested Fix: ${spam.suggestedFix}`);

} catch (e) {
    console.log("Error:", e.stack);
}
