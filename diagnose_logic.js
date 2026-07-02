const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

// Mock browser environment
const document = {
    getElementById: (id) => ({
        value: id === 'productName' ? 'Signal-to-Fix' : (id === 'targetArea' ? 'onboarding' : ''),
        addEventListener: () => {},
        textContent: '',
        className: '',
        innerHTML: '',
        style: {}
    })
};
const window = { localStorage: { getItem: () => null, setItem: () => {} }, isSecureContext: true };
const navigator = { clipboard: { writeText: () => {} } };
const $ = (id) => document.getElementById(id);

// Extract the logic part from app.js (up to analyzeFeedback)
// Actually, let's just eval the whole thing but mock the missing parts.
// We'll use vm to run it in a controlled context.

const vm = require('vm');
const context = {
    document,
    window,
    navigator,
    console,
    localStorage: window.localStorage,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    URL: { createObjectURL: () => '', revokeObjectURL: () => '' },
    Blob: function() {},
    navigator: { clipboard: { writeText: () => Promise.resolve() } },
    confirm: () => true,
    $
};
vm.createContext(context);

try {
    // Transform const to var for global visibility in eval
    let code = content.replace(/^const /gm, 'var ');
    code = code.replace(/^let /gm, 'var ');

    vm.runInContext(code, context);

    const samplePosts = [
        'Signal-to-Fix crashes every time I paste 20 lines on iOS. Screenshot attached.',
        'The onboarding is kind of confusing and hard to use, not sure what to click after import.',
        'Pricing feels expensive and I cannot find how to cancel or get a refund.',
        'Please add JSON export for only kept issues so I can hand it to Codex.',
        'Love this idea, super useful for cleaning up feedback.',
        'GM giveaway airdrop 100x game changer bookmark this #crypto #airdrop #free #wagmi #promo 🚀🚀🚀🚀🚀',
        '日本語UIが使いにくい。ログインできない時のエラーもわかりにくいので対応してほしい。'
    ];

    console.log('--- Diagnosis Report ---');

    // Simulate analyzeFeedback
    context.elements.feedbackInput.value = samplePosts.join('\n');
    context.analyzeFeedback();

    const state = context.state;
    console.log('Number of KEEP items:', state.results.filter(r => r.decision === 'keep').length);
    console.log('Number of clusters generated:', state.clusters.length);
    console.log('Number of rankings generated:', state.ranking.length);

    const topCluster = state.ranking[0];
    const spec = topCluster ? context.generatePRSpec(topCluster) : null;
    console.log('Number of PR Specs generated:', spec ? 1 : 0);

    const implPrompt = spec ? context.generateImplementationPrompt(spec) : '';
    console.log('Number of implementation prompts generated:', implPrompt ? 1 : 0);

    console.log('\n--- Spam Sample Output ---');
    const spam = state.results[5];
    console.log(JSON.stringify(spam, null, 2));

} catch (e) {
    console.log("Error during diagnosis:", e.stack);
}
