const ONBOARDING_HELP_TERMS = [
  'what to paste', "don't understand", 'dont understand', 'confusing', 'when to use',
  'how to use', 'where to use', 'getting started', 'first use', 'guide', 'instructions',
  '使い方', '何を貼る', 'わからない', '分からない', '迷う', 'どこで使う',
  'どこで使え', 'いつ使う', 'ガイド', '説明', '初回', '最初'
];

const RULES = {
  noise: [
    'giveaway', 'airdrop', 'claim reward', 'referral', 'promo', 'thoughts?', 'agree?',
    'bookmark this', 'game changer', 'big if true', '100x', 'gm', 'wagmi', 'free money',
    'retweet to win', 'follow for more', 'must read', 'hot take'
  ],
  useful: [
    'bug', 'broken', 'crash', 'error', 'failed', 'stuck', 'confusing', 'hard to use',
    ...ONBOARDING_HELP_TERMS,
    'slow', 'missing', 'please add', 'need', 'wish', 'support', 'refund', 'cancel', 'expensive', 'pricing', 'docs', 'api', 'screenshot',
    'before/after', 'security', 'vulnerability', 'exploit', 'leak', 'performance', 'lag', 'hang', 'login', 'sign in', 'sign up',
    '使いにくい', 'わかりにくい', 'エラー', '壊れた', '遅い', '重い',
    '落ちる', '開かない', 'ログインできない', '課金', '高い', '解約', '返金',
    'バグ', '追加してほしい', '対応してほしい', '脆弱性', 'セキュリティ', '漏洩', 'ラグ', 'ログイン', 'サインイン'
  ],
  types: {
    'login failure': ['login', 'sign in', 'sign up', 'ログイン', 'サインイン'],
    bug: ['bug', 'broken', 'crash', 'error', 'failed', 'stuck', 'does not work', 'crashes', 'security', 'vulnerability', 'exploit', 'leak', 'エラー', '壊れた', '落ちる', '開かない', 'ログインできない', 'バグ', '脆弱性', 'セキュリティ', '漏洩'],
    'pricing complaint': ['expensive', 'price', 'pricing', 'billing', 'refund', 'cancel', '課金', '高い', '解約', '返金'],
    'onboarding complaint': ONBOARDING_HELP_TERMS,
    'UX complaint': ['confusing', 'hard to use', 'slow', '使いにくい', 'わかりにくい', '重い', '遅い', 'annoying', 'clunky', 'too many steps'],
    'feature request': ['missing', 'please add', 'need', 'wish', 'feature request', '追加してほしい', '対応してほしい', 'support'],
    'docs complaint': ['docs', 'documentation', 'guide', 'tutorial', 'api reference', 'example'],
    praise: ['love', 'great', 'awesome', 'thanks', 'amazing', '便利', '最高'],
    noise: []
  },
  severityHigh: ['crash', 'crashes', 'broken', 'failed', 'refund', 'cancel', 'cannot', "can't", 'stuck', 'security', 'vulnerability', 'exploit', 'leak', '壊れた', '落ちる', '開かない', 'ログインできない', '返金', '解約', '脆弱性', 'セキュリティ', '漏洩'],
  severityMedium: ['error', 'slow', 'confusing', 'hard to use', 'missing', 'expensive', 'pricing', 'docs', 'api', 'performance', 'lag', 'hang', 'エラー', 'バグ', '遅い', '重い', '高い', '課金', 'ラグ'],
  evidence: {
    'multiple-user pattern': ['everyone', 'many users', 'lots of people', 'multiple users', '+1', 'same here'],
    'screenshot-backed': ['screenshot', 'screen shot', 'attached', 'image', 'before/after'],
    'reproducible issue': ['steps', 'reproduce', 'when i', 'after i', 'every time', 'on ios', 'on android', 'ios', 'android', 'ログインできない'],
    'concrete complaint': ['because', 'when', 'after', 'takes', 'shows', 'says', 'cannot', "can't", 'broken', 'security', 'vulnerability', 'fails', ...ONBOARDING_HELP_TERMS, 'performance', 'lag', 'hang', '開かない', '落ちる', '使いにくい', 'わかりにくい', '重い', '遅い', 'ラグ']
  }
};

const spam = "GM giveaway airdrop 100x game changer bookmark this #crypto #airdrop #free #wagmi #promo 🚀🚀🚀🚀🚀";
const text = spam.toLowerCase();

console.log("Checking matches for spam post...");
for (const [group, terms] of Object.entries(RULES.types)) {
    terms.forEach(t => {
        if (text.includes(t.toLowerCase())) {
            console.log(`  RULES.types.${group} match: "${t}"`);
        }
    });
}

for (const t of RULES.useful) {
    if (text.includes(t.toLowerCase())) {
        console.log(`  RULES.useful match: "${t}"`);
    }
}

for (const [group, terms] of Object.entries(RULES.evidence)) {
    terms.forEach(t => {
        if (text.includes(t.toLowerCase())) {
            console.log(`  RULES.evidence.${group} match: "${t}"`);
        }
    });
}

for (const t of RULES.noise) {
    if (text.includes(t.toLowerCase())) {
        console.log(`  RULES.noise match: "${t}"`);
    }
}
