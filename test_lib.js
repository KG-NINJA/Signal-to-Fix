// Signal-to-Fix v1: rule-based X/Twitter feedback triage.
// Edit the keyword groups below to tune classification without adding APIs.

const STORAGE_KEY = 'signal_to_fix_v1';
const EXPORT_BASENAME = 'signal-to-fix-analysis';
const ORIGINAL_PREVIEW_LIMIT = 600;

const ONBOARDING_HELP_TERMS = [
  'what to paste', "don't understand", 'dont understand', 'confusing', 'when to use',
  'how to use', 'where to use', 'getting started', 'first use', 'guide', 'instructions',
  '使い方', '何を貼る', 'わからない', '分からない', '迷う', 'どこで使う',
  'どこで使え', 'いつ使う', 'ガイド', '説明', '初回', '最初'
];

const RULES = {
  // Obvious spam, promotion, engagement bait, and vague hype.
  noise: [
    'giveaway', 'airdrop', 'claim reward', 'referral', 'promo', 'thoughts?', 'agree?',
    'bookmark this', 'game changer', 'big if true', '100x', 'gm', 'wagmi', 'free money',
    'retweet to win', 'follow for more', 'must read', 'hot take'
  ],
  // Signals that should keep or boost feedback because they point to a product problem.
  useful: [
    'bug', 'broken', 'crash', 'error', 'failed', 'stuck', 'confusing', 'hard to use',
    ...ONBOARDING_HELP_TERMS,
    'slow', 'missing', 'please add', 'need', 'wish', 'support', 'refund', 'cancel', 'expensive', 'pricing', 'docs', 'api', 'screenshot',
    'before/after', 'security', 'vulnerability', 'exploit', 'leak', 'performance', 'lag', 'hang', 'login', 'sign in', 'sign up',
    '使いにくい', 'わかりにくい', 'エラー', '壊れた', '遅い', '重い',
    '落ちる', '開かない', 'ログインできない', '課金', '高い', '解約', '返金',
    'バグ', '追加してほしい', '対応してほしい', '脆弱性', 'セキュリティ', '漏洩', 'ラグ', 'ログイン', 'サインイン'
  ],
  // Classification keywords. First strong match wins, then fallback scoring is used.
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

const $ = (id) => document.getElementById(id);
const state = { results: [], clusters: [], ranking: [], prompt: '' };

const elements = {
  productName: $('productName'),
  productUrl: $('productUrl'),
  targetArea: $('targetArea'),
  feedbackInput: $('feedbackInput'),
  analyzeBtn: $('analyzeBtn'),
  loadSampleBtn: $('loadSampleBtn'),
  copyPromptBtn: $('copyPromptBtn'),
  copyPromptInlineBtn: $('copyPromptInlineBtn'),
  exportMdBtn: $('exportMdBtn'),
  exportJsonBtn: $('exportJsonBtn'),
  clearBtn: $('clearBtn'),
  statusMessage: $('statusMessage'),
  resultsSummary: $('resultsSummary'),
  priorityRanking: $('priorityRanking'),
  issueClusters: $('issueClusters'),
  resultsList: $('resultsList'),
  prSpecSection: $('prSpecSection'),
  implPromptSection: $('implPromptSection'),
  summaryText: $('summaryText'),
  promptOutput: $('promptOutput')
};

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function countMatches(text, terms) {
  return terms.filter((term) => text.includes(term.toLowerCase())).length;
}

function hasExcessiveHashtags(post) {
  return (post.match(/#/g) || []).length >= 5;
}

function hasExcessiveEmojis(post) {
  return (post.match(/[\p{Extended_Pictographic}]/gu) || []).length >= 5;
}

function classifyType(text) {
  for (const [type, terms] of Object.entries(RULES.types)) {
    if (type !== 'noise' && includesAny(text, terms)) return type;
  }
  return 'noise';
}

function evidenceLevel(text) {
  for (const [level, terms] of Object.entries(RULES.evidence)) {
    if (includesAny(text, terms)) return level;
  }
  return 'vague opinion';
}

function getProductNameSignal(text) {
  const productName = elements.productName.value.trim().toLowerCase();
  return productName.length >= 2 && text.includes(productName);
}

function buildReasons(text, post, type, noiseScore, usefulScore, evidence, hasProductSignal) {
  const reasons = [];
  if (includesAny(text, RULES.types.bug)) reasons.push('bug keyword detected');
  if (includesAny(text, RULES.types['pricing complaint'])) reasons.push('pricing complaint detected');
  if (includesAny(text, RULES.types['onboarding complaint'])) reasons.push('onboarding/help keyword detected');
  if (includesAny(text, RULES.types['feature request'])) reasons.push('feature request detected');
  if (includesAny(text, RULES.types['UX complaint'])) reasons.push('UX complaint detected');
  if (evidence === 'screenshot-backed') reasons.push('screenshot evidence detected');
  if (evidence === 'reproducible issue') reasons.push('reproducible detail detected');
  if (evidence === 'concrete complaint') reasons.push('concrete complaint detected');
  if (hasProductSignal) reasons.push('product name detected');
  if (includesAny(text, ['game changer', '100x', 'big if true', 'gm', 'wagmi'])) reasons.push('vague hype detected');
  if (includesAny(text, ['thoughts?', 'agree?', 'bookmark this', 'follow for more', 'retweet to win'])) reasons.push('engagement bait detected');
  if (hasExcessiveHashtags(post)) reasons.push('excessive hashtags detected');
  if (hasExcessiveEmojis(post)) reasons.push('excessive emojis detected');
  if (!reasons.length && type === 'praise') reasons.push('praise detected');
  if (!reasons.length && usefulScore > 0) reasons.push('product issue keyword detected');
  if (!reasons.length && noiseScore > 0) reasons.push('noise keyword detected');
  return reasons.length ? [...new Set(reasons)] : ['no strong signal detected'];
}

function analyzePost(post, index) {
  const text = post.toLowerCase();
  const noiseScore = countMatches(text, RULES.noise) + (hasExcessiveHashtags(post) ? 2 : 0) + (hasExcessiveEmojis(post) ? 2 : 0);
  const usefulScore = countMatches(text, RULES.useful);
  const hasProductSignal = getProductNameSignal(text);
  const evidence = evidenceLevel(text);

  const isNoiseOverride = includesAny(text, RULES.noise) ||
                           hasExcessiveHashtags(post) ||
                           hasExcessiveEmojis(post);

  let decision, type;
  if (isNoiseOverride) {
    decision = 'discard';
    type = 'noise';
  } else {
    const hasConcreteSignal = usefulScore > 0 || hasProductSignal || evidence !== 'vague opinion';
    type = hasConcreteSignal ? classifyType(text) : (includesAny(text, RULES.types.praise) ? 'praise' : 'noise');
    decision = 'keep';
    if (!hasConcreteSignal && noiseScore >= 2) decision = 'discard';
    else if (type === 'praise' || type === 'noise' || evidence === 'vague opinion' || noiseScore > usefulScore) decision = 'reduce';
  }

  const reasons = buildReasons(text, post, type, noiseScore, usefulScore, evidence, hasProductSignal);
  const actionabilityScore = usefulScore + (evidence === 'vague opinion' ? 0 : 1) + (hasProductSignal ? 1 : 0) + (type === 'onboarding complaint' ? 1 : 0) + (type !== 'noise' && type !== 'praise' ? 1 : 0);

  const severity = includesAny(text, RULES.severityHigh) ? 'high' : includesAny(text, RULES.severityMedium) ? 'medium' : 'low';
  const actionability = actionabilityScore >= 3 ? 'high' : actionabilityScore >= 1 ? 'medium' : 'low';

  return {
    id: index + 1,
    decision,
    type,
    severity,
    actionability,
elements.productName.value = 'Signal-to-Fix';
const spam = "GM giveaway airdrop 100x game changer bookmark this #crypto #airdrop #free #wagmi #promo 🚀🚀🚀🚀🚀";
console.log(JSON.stringify(analyzePost(spam, 0), null, 2));
