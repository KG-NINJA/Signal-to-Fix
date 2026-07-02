const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('app.js', 'utf8');

// Mock DOM
const domCode = `
const document = {
  getElementById: (id) => ({
    value: '',
    addEventListener: () => {},
    textContent: '',
    className: '',
    innerHTML: '',
    style: {}
  })
};
const window = {
  isSecureContext: true,
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  }
};
const navigator = {
  clipboard: {
    writeText: () => Promise.resolve()
  }
};
const URL = {
  createObjectURL: () => '',
  revokeObjectURL: () => ''
};
`;

const contextObject = {};
vm.createContext(contextObject);
vm.runInContext(domCode + code, contextObject);

const samplePosts = [
    'Signal-to-Fix crashes every time I paste 20 lines on iOS. Screenshot attached.',
    'The onboarding is kind of confusing and hard to use, not sure what to click after import.',
    'Pricing feels expensive and I cannot find how to cancel or get a refund.',
    'Please add JSON export for only kept issues so I can hand it to Codex.',
    'Love this idea, super useful for cleaning up feedback.',
    'GM giveaway airdrop 100x game changer bookmark this #crypto #airdrop #free #wagmi #promo 🚀🚀🚀🚀🚀',
    '日本語UIが使いにくい。ログインできない時のエラーもわかりにくいので対応してほしい。'
];

// Set product context
contextObject.elements.productName.value = 'Signal-to-Fix';
contextObject.elements.productUrl.value = 'https://example.com';
contextObject.elements.targetArea.value = 'onboarding';

console.log('--- Analyzing Posts ---');
const results = samplePosts.map((post, i) => contextObject.analyzePost(post, i));
contextObject.state.results = results;

results.forEach((r, i) => {
    console.log(`Post ${i+1}: decision=${r.decision}, type=${r.type}`);
    if (i === 5) {
        console.log('Spam output:', JSON.stringify(r, null, 2));
    }
});

console.log('\n--- Running Clustering ---');
const clusters = contextObject.getIssueClusters();
contextObject.state.clusters = clusters;
console.log('Clusters count:', clusters.length);
clusters.forEach(c => console.log(`- ${c.title} (freq: ${c.frequency}, score: ${c.priorityScore})`));

console.log('\n--- Running Ranking ---');
const ranking = [...clusters].sort((a, b) => b.priorityScore - a.priorityScore || b.frequency - a.frequency);
contextObject.state.ranking = ranking;
console.log('Ranking count:', ranking.length);

console.log('\n--- PR Spec & Prompt Check ---');
const topCluster = ranking[0];
const spec = topCluster ? contextObject.generatePRSpec(topCluster) : null;
const implPrompt = spec ? contextObject.generateImplementationPrompt(spec) : '';

console.log('PR Spec generated:', !!spec);
console.log('Impl Prompt generated:', !!implPrompt);

console.log('\n--- Regression Report ---');
console.log('KEEP items:', results.filter(r => r.decision === 'keep').length);
console.log('Clusters generated:', clusters.length);
console.log('Rankings generated:', ranking.length);
console.log('PR Specs generated:', spec ? 1 : 0);
console.log('Implementation Prompts generated:', implPrompt ? 1 : 0);
