const fs = require('fs');
const code = fs.readFileSync('app.js', 'utf8');

const createMockElement = (id) => ({
    value: '',
    textContent: '',
    className: '',
    innerHTML: '',
    addEventListener: () => {}
});

const document = {
    getElementById: (id) => createMockElement(id)
};

const window = { localStorage: { getItem: () => null, setItem: () => {} }, isSecureContext: true, confirm: () => true };
const navigator = { clipboard: { writeText: () => {} } };
const $ = (id) => document.getElementById(id);
const URL = { createObjectURL: () => '', revokeObjectURL: () => '' };
const Blob = function() {};

let cleanCode = code.replace(/const state =/g, 'var state =');
cleanCode = cleanCode.replace(/const elements =/g, 'var elements =');
cleanCode = cleanCode.replace(/const \$ =/g, 'var $ =');
// Handle duplicate topCluster in buildCodexPrompt if any
cleanCode = cleanCode.replace(/const topCluster = ranking\[0\];/g, (match, offset, string) => {
    return "var topCluster = ranking[0];";
});

try {
    eval(cleanCode);

    elements.productName.value = 'Signal-to-Fix';
    elements.productUrl.value = 'https://example.com';
    elements.targetArea.value = 'onboarding';

    const samplePosts = [
        'Signal-to-Fix crashes every time I paste 20 lines on iOS. Screenshot attached.',
        'The onboarding is kind of confusing and hard to use, not sure what to click after import.',
        'Pricing feels expensive and I cannot find how to cancel or get a refund.',
        'Please add JSON export for only kept issues so I can hand it to Codex.',
        'Love this idea, super useful for cleaning up feedback.',
        'GM giveaway airdrop 100x game changer bookmark this #crypto #airdrop #free #wagmi #promo 🚀🚀🚀🚀🚀',
        '日本語UIが使いにくい。ログインできない時のエラーもわかりにくいので対応してほしい。'
    ];

    elements.feedbackInput.value = samplePosts.join('\n');

    analyzeFeedback();

    console.log('--- Diagnosis Report ---');
    console.log('state.results.length:', state.results.length);
    console.log('KEEP count:', state.results.filter(r => r.decision === 'keep').length);
    console.log('state.clusters.length:', state.clusters.length);
    console.log('state.ranking.length:', state.ranking.length);

    const spam = state.results[5];
    console.log('\n--- Spam Analysis ---');
    console.log(`Original: ${spam.originalPost}`);
    console.log(`Decision: ${spam.decision}`);
    console.log(`Type: ${spam.type}`);
    console.log(`Reasons: ${JSON.stringify(spam.reasons)}`);

} catch (e) {
    console.log("ERROR:", e.stack);
}
