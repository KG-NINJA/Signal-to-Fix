# Signal-to-Fix

Signal-to-Fix turns messy X/Twitter feedback posts into structured product improvement tasks that can be handed to Codex.

It is a standalone, static GitHub Pages app built with plain HTML, CSS, and JavaScript. It does not use a backend, external libraries, AI APIs, the X API, or the GitHub API.

For AI-agent operation, Signal-to-Fix links to HyperXosist-Agent for paid X/Twitter feedback sourcing through the existing x402 Worker. Human browser analysis remains local and free.

## Why it exists

Useful product feedback on X/Twitter is often mixed with promotion, engagement bait, vague praise, and spam. Signal-to-Fix gives product builders a simple manual workflow:

1. Search X/Twitter yourself.
2. Paste candidate posts into the app.
3. Let simple local rules filter obvious noise.
4. Review structured product issues.
5. Export a small, practical Codex prompt for implementation.

The goal of v1 is clarity, not automation.

## How to use it

1. Open `index.html` locally or deploy the repository to GitHub Pages.
2. Fill in the product context:
   - Product name
   - Product URL
   - Target area, such as `iOS app`, `Android app`, `landing page`, `docs`, `checkout`, `onboarding`, `API`, or `pricing page`
3. Paste X/Twitter posts into the feedback box, one post per line.
4. Click **Analyze Feedback**, or use **Load sample feedback** to try the built-in mixed English/Japanese examples.
5. Review each result:
   - decision: keep, reduce, or discard
   - type
   - severity
   - actionability
   - evidence level
   - extracted problem
   - suggested fix
   - original post
   - short reason labels explaining the classification
6. Use the export buttons:
   - **Copy Codex Prompt** copies a practical implementation prompt.
   - **Export Markdown** downloads the analysis and prompt as `.md`.
   - **Export JSON** downloads structured results as `.json`.
   - **Clear** resets inputs and results after confirmation.

## What v1 does

- Runs fully in the browser.
- Treats each pasted line as one feedback item.
- Uses editable keyword and scoring rules in `app.js`.
- Discards or reduces obvious noise such as giveaways, referral spam, engagement bait, excessive hashtags, excessive emojis, and vague hype.
- Keeps or boosts concrete product complaints, including English and Japanese terms for bugs, errors, slowness, refunds, cancellation, docs, API, and feature requests.
- Generates a Codex-ready prompt that asks for a small first improvement pass and explicitly says not to overbuild.
- Persists product context, pasted feedback, analysis results, and the generated prompt in `localStorage`.
- Exposes `agent-use.json` and `x402-payment.json` so AI agents can discover the paid HyperXosist sourcing flow before using Signal-to-Fix outputs.

## What v1 does not do

- It does not call AI APIs.
- It does not use the X/Twitter API.
- It does not fetch posts automatically.
- It does not post to GitHub or create GitHub issues.
- It does not use a backend, database, authentication, or build tools.
- It does not guarantee perfect classification.

## AI agent workflow with HyperXosist-Agent

- Signal-to-Fix agent manifest: `agent-use.json`
- Signal-to-Fix payment manifest: `x402-payment.json`
- Linked search agent: `https://kg-ninja.github.io/HyperXosist-Agent/agent-use.json`
- Existing x402 endpoint: `https://kg-ninja-x402-revenue-gate-mainnet-staging.fuwafuwow.workers.dev/hyperxosist-query`

AI agents should pay through the existing x402 endpoint for HyperXosist query generation, gather candidate X/Twitter feedback, then paste/analyze that feedback in Signal-to-Fix. Downstream Signal-to-Fix outputs use only items where `decision === "keep"`.

## Public integration verification

Expected PASS conditions:

- `https://kg-ninja.github.io/Signal-to-Fix/` loads.
- `https://kg-ninja.github.io/Signal-to-Fix/agent-use.json` loads and parses as JSON.
- `https://kg-ninja.github.io/Signal-to-Fix/x402-payment.json` loads and parses as JSON.
- `https://kg-ninja.github.io/Signal-to-Fix/agent-use.json` links to `https://kg-ninja.github.io/HyperXosist-Agent/agent-use.json`.
- `agent-use.json` keeps `signalAnalysisSourceOfTruth` as `decision === "keep"`.
- Existing x402 unpaid test remains `POST https://kg-ninja-x402-revenue-gate-mainnet-staging.fuwafuwow.workers.dev/hyperxosist-query -> 402`.

## Limitations

Signal-to-Fix v1 is intentionally rule-based. It can miss sarcasm, mixed-language nuance, screenshots without text, duplicate patterns, and issues that require domain knowledge. Treat the output as a triage aid, not a final product decision.

Because all processing is local, pasted data stays in your browser. However, browser `localStorage` is not encrypted, so do not paste secrets or private user data.

## Future ideas

- X API integration for authenticated search and import.
- MCP integration for agent workflows.
- GitHub issue export.
- Screenshot clustering.
- Multi-post pattern detection.

## Deploying to GitHub Pages

No build step is required.

1. Push this repository to GitHub.
2. Open repository **Settings** → **Pages**.
3. Choose **Deploy from a branch**.
4. Select the main branch and `/ (root)`.
5. Save and open the published Pages URL.
