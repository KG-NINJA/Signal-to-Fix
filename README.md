# Signal-to-Fix

Signal-to-Fix turns messy X/Twitter feedback posts into structured product improvement tasks that can be handed to Codex.

It is a standalone, static GitHub Pages app built with plain HTML, CSS, and JavaScript. It does not use a backend, external libraries, AI APIs, the X API, or the GitHub API.

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

## What v1 does not do

- It does not call AI APIs.
- It does not use the X/Twitter API.
- It does not fetch posts automatically.
- It does not post to GitHub or create GitHub issues.
- It does not use a backend, database, authentication, or build tools.
- It does not guarantee perfect classification.

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
