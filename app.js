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
    'before/after', '使いにくい', 'わかりにくい', 'エラー', '壊れた', '遅い', '重い',
    '落ちる', '開かない', 'ログインできない', '課金', '高い', '解約', '返金',
    'バグ', '追加してほしい', '対応してほしい'
  ],
  // Classification keywords. First strong match wins, then fallback scoring is used.
  types: {
    bug: ['bug', 'broken', 'crash', 'error', 'failed', 'stuck', 'does not work', 'crashes', 'エラー', '壊れた', '落ちる', '開かない', 'ログインできない', 'バグ'],
    'onboarding complaint': ONBOARDING_HELP_TERMS,
    'UX complaint': ['confusing', 'hard to use', 'slow', '使いにくい', 'わかりにくい', '重い', '遅い', 'annoying', 'clunky', 'too many steps'],
    'feature request': ['missing', 'please add', 'need', 'wish', 'feature request', '追加してほしい', '対応してほしい', 'support'],
    'pricing complaint': ['expensive', 'price', 'pricing', 'billing', 'refund', 'cancel', '課金', '高い', '解約', '返金'],
    'docs complaint': ['docs', 'documentation', 'guide', 'tutorial', 'api reference', 'example'],
    praise: ['love', 'great', 'awesome', 'thanks', 'amazing', '便利', '最高'],
    noise: []
  },
  severityHigh: ['crash', 'crashes', 'broken', 'failed', 'refund', 'cancel', 'cannot', "can't", 'stuck', '壊れた', '落ちる', '開かない', 'ログインできない', '返金', '解約'],
  severityMedium: ['error', 'slow', 'confusing', 'hard to use', 'missing', 'expensive', 'pricing', 'docs', 'api', 'エラー', 'バグ', '遅い', '重い', '高い', '課金'],
  evidence: {
    'multiple-user pattern': ['everyone', 'many users', 'lots of people', 'multiple users', '+1', 'same here'],
    'screenshot-backed': ['screenshot', 'screen shot', 'attached', 'image', 'before/after'],
    'reproducible issue': ['steps', 'reproduce', 'when i', 'after i', 'every time', 'on ios', 'on android', 'ios', 'android', 'ログインできない'],
    'concrete complaint': ['because', 'when', 'after', 'takes', 'shows', 'says', 'cannot', "can't", ...ONBOARDING_HELP_TERMS, '開かない', '落ちる', '使いにくい', 'わかりにくい', '重い', '遅い']
  }
};

const $ = (id) => document.getElementById(id);
const state = { results: [], prompt: '' };

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
  resultsList: $('resultsList'),
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
  const hasConcreteSignal = usefulScore > 0 || hasProductSignal || evidence !== 'vague opinion';
  const type = hasConcreteSignal ? classifyType(text) : (includesAny(text, RULES.types.praise) ? 'praise' : 'noise');
  const reasons = buildReasons(text, post, type, noiseScore, usefulScore, evidence, hasProductSignal);
  const actionabilityScore = usefulScore + (evidence === 'vague opinion' ? 0 : 1) + (hasProductSignal ? 1 : 0) + (type === 'onboarding complaint' ? 1 : 0) + (type !== 'noise' && type !== 'praise' ? 1 : 0);

  let decision = 'keep';
  if (!hasConcreteSignal && noiseScore >= 2) decision = 'discard';
  else if (type === 'praise' || type === 'noise' || evidence === 'vague opinion' || noiseScore > usefulScore) decision = 'reduce';

  const severity = includesAny(text, RULES.severityHigh) ? 'high' : includesAny(text, RULES.severityMedium) ? 'medium' : 'low';
  const actionability = actionabilityScore >= 3 ? 'high' : actionabilityScore >= 1 ? 'medium' : 'low';

  return {
    id: index + 1,
    decision,
    type,
    severity,
    actionability,
    evidenceLevel: evidence,
    reasons,
    extractedProblem: extractProblem(post, type, decision),
    suggestedFix: suggestFix(post, type, severity),
    originalPost: post
  };
}

function extractProblem(post, type, decision) {
  if (decision === 'discard') return 'No concrete product issue detected.';
  const cleaned = post.replace(/https?:\/\/\S+/g, '').trim();
  return `${type}: ${cleaned.slice(0, 180)}${cleaned.length > 180 ? '…' : ''}`;
}

function suggestFix(post, type, severity) {
  const prefix = severity === 'high' ? 'Prioritize a small fix or guardrail' : 'Make a focused improvement';
  const suggestions = {
    bug: `${prefix}: reproduce the failure, add a regression check, and patch the smallest broken path.`,
    'onboarding complaint': `${prefix}: add compact how-to-use steps, helper text near the paste box, and button explanations for Analyze Feedback, Copy Codex Prompt, Export Markdown, Export JSON, and keep/reduce/discard.`,
    'UX complaint': `${prefix}: simplify the confusing step, clarify labels, or add inline guidance.`,
    'feature request': `${prefix}: add the smallest useful version or document a workaround.`,
    'pricing complaint': `${prefix}: clarify pricing, cancellation, refund, or plan comparison copy.`,
    'docs complaint': `${prefix}: improve the missing docs section with one concrete example.`,
    praise: 'Do not implement from praise alone; keep as supporting context.',
    noise: 'No action recommended.'
  };
  return suggestions[type] || 'Review manually and make the smallest useful change.';
}

function analyzeFeedback() {
  const posts = elements.feedbackInput.value.split('\n').map((line) => line.trim()).filter(Boolean);
  state.results = posts.map(analyzePost);
  state.prompt = buildCodexPrompt();
  render();
  saveState();
  elements.statusMessage.textContent = posts.length ? `Analyzed ${posts.length} feedback item${posts.length === 1 ? '' : 's'}.` : 'Paste at least one post to analyze.';
}

function usefulResults() {
  return state.results.filter((item) => item.decision !== 'discard' && item.type !== 'noise');
}

function buildCodexPrompt() {
  const productName = elements.productName.value.trim() || '[product name]';
  const productUrl = elements.productUrl.value.trim() || '[product URL]';
  const targetArea = elements.targetArea.value.trim() || '[target area]';
  const useful = usefulResults().sort((a, b) => scoreResult(b) - scoreResult(a)).slice(0, 8);
  const evidence = useful.length ? useful.map((item) => `- ${item.evidenceLevel}: ${item.originalPost}`).join('\n') : '- No concrete evidence captured yet.';
  const issues = useful.length ? useful.slice(0, 5).map((item, i) => `${i + 1}. ${item.extractedProblem}\n   - Type: ${item.type}\n   - Severity: ${item.severity}\n   - Actionability: ${item.actionability}\n   - Evidence level: ${item.evidenceLevel}\n   - Why classified this way: ${(item.reasons || ['no reason saved']).join(', ')}\n   - Suggested fix: ${item.suggestedFix}`).join('\n') : '1. No prioritized issue yet; do not invent work without stronger evidence.';
  const firstPass = useful.length ? useful.slice(0, 3).map((item) => `- ${item.suggestedFix}`).join('\n') : '- Ask for more concrete feedback or reproduce the issue manually before changing product code.';

  return `Title:\nImprove ${productName} based on X/Twitter feedback\n\nContext:\n- Product: ${productName}\n- Product URL: ${productUrl}\n- Target area: ${targetArea}\n\nEvidence:\n${evidence}\n\nPrioritized issues:\n${issues}\n\nRecommended small first pass:\n${firstPass}\n- Keep changes small, focused, and easy to review.\n- Prefer the highest-actionability issue if time is limited.\n\nNon-goals:\n- Do not redesign the entire app.\n- Do not add APIs, authentication, databases, or new dependencies.\n- Do not use the GitHub API unless it is already configured in this repository.\n- Do not overbuild beyond the evidence above.\n\nScreenshot instruction:\n- If browser/computer-use is available, capture before/after screenshots for the changed flow or UI.\n- If screenshots are not possible, explain why and include a concise manual verification note.\n\nCompatibility:\n- Keep the app stable and GitHub Pages compatible.`;
}

function scoreResult(item) {
  const sev = { high: 3, medium: 2, low: 1 }[item.severity];
  const act = { high: 3, medium: 2, low: 1 }[item.actionability];
  const dec = { keep: 2, reduce: 1, discard: 0 }[item.decision];
  return sev + act + dec;
}

function render() {
  const kept = state.results.filter((r) => r.decision === 'keep').length;
  const reduced = state.results.filter((r) => r.decision === 'reduce').length;
  const discarded = state.results.filter((r) => r.decision === 'discard').length;
  elements.summaryText.textContent = state.results.length ? `${kept} keep, ${reduced} reduce, ${discarded} discard.` : 'Analyze feedback to see kept, reduced, and discarded posts.';
  elements.promptOutput.value = state.prompt || '';
  elements.resultsSummary.className = state.results.length ? 'results-summary' : 'results-summary empty-state';
  elements.resultsSummary.innerHTML = state.results.length ? resultSummaryCard(kept, reduced, discarded) : 'Run analysis to see a short workflow summary.';
  elements.resultsList.className = state.results.length ? 'results-list' : 'results-list empty-state';
  elements.resultsList.innerHTML = state.results.length ? state.results.map(resultCard).join('') : 'No analysis yet.';
}

function resultSummaryCard(kept, reduced, discarded) {
  const total = state.results.length;
  const topType = getTopIssueType();
  const targetArea = elements.targetArea.value.trim() || 'the highest-signal area';
  const usefulLabel = kept === 1 ? 'useful signal' : 'useful signals';
  const weakCount = reduced;
  const weakLabel = weakCount === 1 ? 'weak/noisy signal' : 'weak/noisy signals';
  const discardLabel = discarded === 1 ? 'discarded item' : 'discarded items';
  return `<div class="summary-grid">
    <div><span class="summary-number">${total}</span><span class="summary-label">posts analyzed</span></div>
    <div><span class="summary-number keep-text">${kept}</span><span class="summary-label">keep</span></div>
    <div><span class="summary-number reduce-text">${reduced}</span><span class="summary-label">reduce</span></div>
    <div><span class="summary-number discard-text">${discarded}</span><span class="summary-label">discard</span></div>
  </div>
  <p class="summary-sentence">${total} posts analyzed. ${kept} ${usefulLabel}, ${weakCount} ${weakLabel}, ${discarded} ${discardLabel}. Top issue type: <strong>${escapeHtml(topType)}</strong>. Next: copy the Codex prompt and ask Codex to improve ${escapeHtml(targetArea)}.</p>`;
}

function getTopIssueType() {
  const counts = state.results
    .filter((item) => item.decision !== 'discard' && item.type !== 'noise' && item.type !== 'praise')
    .reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});
  const [topType] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ['No product issue yet'];
  return topType;
}

function decisionExplanation(decision) {
  return {
    keep: 'useful signal',
    reduce: 'weak or noisy but possibly useful',
    discard: 'likely noise'
  }[decision] || 'needs review';
}

function previewText(value, limit = ORIGINAL_PREVIEW_LIMIT) {
  const text = String(value);
  return text.length > limit ? `${text.slice(0, limit)}… [truncated in preview; exports keep full text]` : text;
}

function resultCard(item) {
  return `<article class="result-card ${item.decision}">
    <div class="result-top">
      <span class="badge ${item.decision}">${escapeHtml(item.decision)} = ${escapeHtml(decisionExplanation(item.decision))}</span>
      <span class="badge type-badge">${escapeHtml(item.type)}</span>
    </div>
    <div class="result-main">
      <div class="result-field problem"><strong>Extracted problem</strong>${escapeHtml(item.extractedProblem)}</div>
      <div class="result-field fix"><strong>Suggested fix</strong>${escapeHtml(item.suggestedFix)}</div>
    </div>
    <details class="result-details">
      <summary>Show labels and original post</summary>
      <div class="result-grid">
        <div class="result-field"><strong>Severity</strong>${escapeHtml(item.severity)}</div>
        <div class="result-field"><strong>Actionability</strong>${escapeHtml(item.actionability)}</div>
        <div class="result-field"><strong>Evidence level</strong>${escapeHtml(item.evidenceLevel)}</div>
        <div class="result-field"><strong>Why classified this way</strong>${escapeHtml((item.reasons || []).join(', '))}</div>
        <div class="result-field original"><strong>Original post</strong>${escapeHtml(previewText(item.originalPost))}</div>
      </div>
    </details>
  </article>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function saveState() {
  if (state.results.length) {
    state.prompt = buildCodexPrompt();
    elements.promptOutput.value = state.prompt;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      productName: elements.productName.value,
      productUrl: elements.productUrl.value,
      targetArea: elements.targetArea.value,
      feedback: elements.feedbackInput.value,
      results: state.results,
      prompt: state.prompt
    }));
  } catch (error) {
    elements.statusMessage.textContent = 'Analysis still works, but this browser blocked saving.';
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    elements.productName.value = saved.productName || '';
    elements.productUrl.value = saved.productUrl || '';
    elements.targetArea.value = saved.targetArea || '';
    elements.feedbackInput.value = saved.feedback || '';
    state.results = Array.isArray(saved.results) ? saved.results : [];
    state.prompt = saved.prompt || '';
  } catch (error) {
    elements.statusMessage.textContent = 'Saved data could not be loaded. Starting with a blank workspace.';
    state.results = [];
    state.prompt = '';
  }

  render();
}

function downloadFile(filename, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function markdownExport() {
  const rows = state.results.map((item) => `- **${item.decision} / ${item.type} / ${item.severity}** — ${item.extractedProblem}\n  - Actionability: ${item.actionability}\n  - Evidence: ${item.evidenceLevel}\n  - Why classified this way: ${(item.reasons || []).join(', ')}\n  - Suggested fix: ${item.suggestedFix}\n  - Original: ${item.originalPost}`).join('\n');
  return `# Signal-to-Fix Analysis\n\n${rows || 'No analysis yet.'}\n\n## Codex Prompt\n\n\`\`\`text\n${state.prompt || buildCodexPrompt()}\n\`\`\`\n`;
}

async function copyPrompt() {
  const prompt = state.prompt || buildCodexPrompt();
  elements.promptOutput.value = prompt;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(prompt);
    } else {
      elements.promptOutput.focus();
      elements.promptOutput.select();
      if (!document.execCommand('copy')) throw new Error('copy command rejected');
    }
    elements.statusMessage.textContent = 'Codex prompt copied to clipboard.';
  } catch (error) {
    elements.promptOutput.focus();
    elements.promptOutput.select();
    elements.statusMessage.textContent = 'Copy failed. The prompt is selected so you can copy it manually.';
  }
}


function loadSampleFeedback() {
  elements.productName.value = elements.productName.value || 'Signal-to-Fix';
  elements.productUrl.value = elements.productUrl.value || 'https://example.com';
  elements.targetArea.value = elements.targetArea.value || 'onboarding';
  elements.feedbackInput.value = [
    'Signal-to-Fix crashes every time I paste 20 lines on iOS. Screenshot attached.',
    'The onboarding is kind of confusing and hard to use, not sure what to click after import.',
    'Pricing feels expensive and I cannot find how to cancel or get a refund.',
    'Please add JSON export for only kept issues so I can hand it to Codex.',
    'Love this idea, super useful for cleaning up feedback.',
    'GM giveaway airdrop 100x game changer bookmark this #crypto #airdrop #free #wagmi #promo 🚀🚀🚀🚀🚀',
    '日本語UIが使いにくい。ログインできない時のエラーもわかりにくいので対応してほしい。'
  ].join('\n');
  analyzeFeedback();
  elements.statusMessage.textContent = 'Loaded and analyzed sample feedback.';
}

function clearAll() {
  if (!confirm('Clear inputs and results?')) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    elements.statusMessage.textContent = 'Cleared on screen, but saved data could not be removed.';
  }
  elements.productName.value = '';
  elements.productUrl.value = '';
  elements.targetArea.value = '';
  elements.feedbackInput.value = '';
  state.results = [];
  state.prompt = '';
  render();
  elements.statusMessage.textContent = 'Cleared.';
}

elements.analyzeBtn.addEventListener('click', analyzeFeedback);
elements.loadSampleBtn.addEventListener('click', loadSampleFeedback);
elements.copyPromptBtn.addEventListener('click', copyPrompt);
elements.copyPromptInlineBtn.addEventListener('click', copyPrompt);
elements.exportMdBtn.addEventListener('click', () => downloadFile(`${EXPORT_BASENAME}.md`, 'text/markdown', markdownExport()));
elements.exportJsonBtn.addEventListener('click', () => downloadFile(`${EXPORT_BASENAME}.json`, 'application/json', JSON.stringify({ context: { productName: elements.productName.value, productUrl: elements.productUrl.value, targetArea: elements.targetArea.value }, results: state.results, codexPrompt: state.prompt || buildCodexPrompt() }, null, 2)));
elements.clearBtn.addEventListener('click', clearAll);
[elements.productName, elements.productUrl, elements.targetArea, elements.feedbackInput].forEach((input) => input.addEventListener('input', saveState));

loadState();
