const RULES = {
  noise: ['giveaway', 'airdrop', 'promo'],
  useful: ['bug', 'broken'],
  types: { bug: ['bug'] },
  severityHigh: [],
  severityMedium: [],
  evidence: { 'concrete complaint': ['because'] }
};
const elements = { productName: { value: 'Signal-to-Fix' } };
const includesAny = (text, terms) => terms.some(t => text.includes(t.toLowerCase()));
const countMatches = (text, terms) => terms.filter(t => text.includes(t.toLowerCase())).length;
const hasExcessiveHashtags = (post) => (post.match(/#/g) || []).length >= 5;
const hasExcessiveEmojis = (post) => (post.match(/[\p{Extended_Pictographic}]/gu) || []).length >= 5;
const evidenceLevel = (text) => 'vague opinion';
const classifyType = (text) => 'noise';
const getProductNameSignal = (text) => false;
const buildReasons = () => [];
const extractProblem = () => "";
const suggestFix = () => "";

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
    type = hasConcreteSignal ? classifyType(text) : 'noise';
    decision = 'keep';
    if (!hasConcreteSignal && noiseScore >= 2) decision = 'discard';
    else if (type === 'noise' || noiseScore > usefulScore) decision = 'reduce';
  }

  return { decision, type };
}

const spam = "GM giveaway airdrop 100x game changer bookmark this #crypto #airdrop #free #wagmi #promo 🚀🚀🚀🚀🚀";
console.log(analyzePost(spam, 0));
