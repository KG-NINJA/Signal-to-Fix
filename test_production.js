const fs = require('fs');
const code = fs.readFileSync('app.js', 'utf8');

// Mock browser globals
global.document = {
    getElementById: (id) => ({
        value: '',
        addEventListener: () => {},
        textContent: '',
        className: '',
        innerHTML: '',
        style: {}
    })
};
global.window = {
    localStorage: {
        getItem: () => null,
        setItem: () => {}
    },
    isSecureContext: true
};
global.navigator = {
    clipboard: {
        writeText: () => Promise.resolve()
    }
};
global.localStorage = global.window.localStorage;
global.confirm = () => true;
global.$ = (id) => global.document.getElementById(id);

// Evaluate the code
try {
    eval(code);
} catch (e) {
    console.log("EVAL ERROR:", e.stack);
    process.exit(1);
}

// Setup input
elements.productName.value = 'Signal-to-Fix';
elements.productUrl.value = 'https://example.com';
elements.targetArea.value = 'onboarding';
elements.feedbackInput.value = [
    'Signal-to-Fix crashes every time I paste 20 lines on iOS. Screenshot attached.',
    'The onboarding is kind of confusing and hard to use, not sure what to click after import.',
    'Pricing feels expensive and I cannot find how to cancel or get a refund.',
    'Please add JSON export for only kept issues so I can hand it to Codex.',
    'Love this idea, super useful for cleaning up feedback.',
    'GM giveaway airdrop 100x game changer bookmark this #crypto #airdrop #free #wagmi #promo 🚀🚀🚀🚀🚀',
    '日本語UIが使いにくい。ログインできない時のエラーもわかりにくいので対応してほしい。'
].join('\n');

// Run analysis
analyzeFeedback();

console.log('REGRESSION REPORT');
console.log('KEEP items:', state.results.filter(r => r.decision === 'keep').length);
console.log('Clusters generated:', state.clusters.length);
console.log('Rankings generated:', state.ranking.length);

const topCluster = state.ranking[0];
const spec = topCluster ? generatePRSpec(topCluster) : null;
const implPrompt = spec ? generateImplementationPrompt(spec) : '';

console.log('PR Specs generated:', spec ? 1 : 0);
console.log('Implementation Prompts generated:', implPrompt ? 1 : 0);

const spam = state.results[5];
console.log('\nSPAM SAMPLE OUTPUT');
console.log(`Original: ${spam.originalPost}`);
console.log(`Decision: ${spam.decision}`);
console.log(`Type: ${spam.type}`);
console.log(`Extracted Problem: ${spam.extractedProblem}`);
console.log(`Suggested Fix: ${spam.suggestedFix}`);
