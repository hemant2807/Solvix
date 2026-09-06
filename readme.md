# Solvix

Solvix is an AI-powered Chrome Extension for LeetCode that combines coding practice, submission tracking, AI assistance, progress analytics, and GitHub solution synchronization in one workflow.

# 1. Features

Track LeetCode submissions, attempts, streaks, and progress.

AI assistance for explanations, hints, code optimization, bug finding, and solutions.

Practice using curated problem sheets such as Blind 75, NeetCode 150, and Striver SDE.

Automatically detect and track LeetCode submission verdicts.

Sync accepted solutions with GitHub.

View practice statistics and topic-based analytics.

Find alternative resources for supported problems.



# 2. Getting Started

2.1 Install Solvix

Visit the Solvix website.

Click Add to Chrome.

Chrome will open the Solvix Chrome Web Store page.

Click Add to Chrome and then Add Extension.

Open LeetCode and log in to your account.

Open the Solvix extension from the Chrome toolbar or Chrome Side Panel.

2.2 Generate a Free Groq API Key

Solvix uses the Groq API for its AI features. Groq provides a Free Tier with usage limits.

Visit the Groq Console.

Sign in or create a Groq account.

Open API Keys.

Click Create API Key.

Enter a name for the key and create it.

Copy the generated API key.

Open the Solvix Side Panel.

Paste the key into the Groq API Key field.

Save or confirm the key and start using the AI features.

The Free Tier is subject to Groq's current rate and usage limits.

Security: Never share your API key or commit it to a public repository.

2.3 Start Practicing

Open any LeetCode problem.

Solvix automatically detects the current problem.

Use the Side Panel to track your practice and access AI assistance.

Ask for an explanation, hint, optimization, bug analysis, or solution when required.

Submit your solution on LeetCode normally.

Solvix records the submission and updates your progress.

If GitHub is connected, accepted solutions can be synchronized with your repository.



# 3. Documentation

For complete technical documentation covering the architecture, project structure, application flow, backend, database, AI integration, authentication, components, APIs, debugging, and development workflow, see:

Read the Complete Documentation 



# 4. Developer Setup

4.1 Requirements

Node.js

MongoDB

Groq API key

GitHub OAuth credentials for GitHub synchronization

4.2 Run Locally

# Backend
cd Backend
npm install
npm run dev

# Extension
cd track-it
npm install
npm run dev

For Chrome extension development, open chrome://extensions, enable Developer mode, and load the generated extension build.



# 5. Links

Website: https://solvix-rouge.vercel.app/

GitHub: https://github.com/mangalam-srv/Solvix

Groq Console: https://console.groq.com/

LeetCode: https://leetcode.com/
