# verifAI (local demo)

Learn a programming concept, prove it with a challenge, and only then let the AI build with it.

## Run it

You need [Node.js 18 or newer](https://nodejs.org). There are no packages to install.

```bash
cd verifai-site
npm start
```

Then open **http://localhost:4173**.

You can also double-click `index.html` to browse the pages without the server. The tree, challenges, guided task and team pages all work that way. Only **Settings** (API keys) and the tutor's free-text answers need the server.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Start page: choose to continue as a developer or a manager |
| `home.html` | Developer home: level, where you left off, your languages, challenges, goals, recent activity |
| `tree.html` | The learning tree. Click a node for details and what the assistant may do with it |
| `challenge.html` | A verification challenge. The assistant is paused, and passing unlocks the concept |
| `guided-task.html` | Learn while doing a real task. Start one from the library or describe your own, switch between tasks, reset or delete them. The tutor teaches, you write, then short checks unlock the concepts |
| `assistant.html` | Chat with the AI, but only about concepts you've verified. Questions that need anything else are sent to your tree instead |
| `team.html` | Manager view: goals, people, and guided tasks (mark a concept as known, or add one). Only managers can open it |
| `settings.html` | Your AI providers: add API keys, test them, choose the model |
| `architecture.html` | Standalone system architecture chart, not part of the app's navigation |

All pages share one demo state saved in your browser: when the manager marks something as known on the Team page, it shows as verified on your tree. Use **Reset demo** in the footer to start over.

## API keys and models

Each user adds their own keys on **Settings** (the gear icon). Supported providers:

- Anthropic (Claude)
- OpenAI
- Google (Gemini)
- Mistral
- Any OpenAI-compatible endpoint, such as Ollama (`http://localhost:11434/v1`) or vLLM. The key is optional here.

After you save a key, the server calls the provider's model list. Then you pick a model from the models your key can actually use. You can also choose a default provider, and switch models per conversation in the guided task's tutor.

How the keys are handled:

- They're stored in `server/data/keys.json`, encrypted with AES-256-GCM.
- The master key is created in `server/data/master.key`, or comes from the `VERIFAI_SECRET` environment variable if you set it.
- Keys are never sent back to the browser (only the last 4 characters) and never logged.
- The server only listens on `127.0.0.1`, so other machines on your network can't reach it.
- `server/data/` is in `.gitignore`. Don't commit it.

Saving a key or pressing **Test connection** lists models. That's free with every provider. Chatting with the tutor uses your key and may cost money with your provider.

## Developer levels and career ladder

Verified concepts earn XP (Basics 10 up to Advanced 50). Levels 1 to 6 (Newcomer, Beginner, Junior, Intermediate, Advanced, Senior) follow total XP. The top level, **Full Stack Engineer**, needs Senior in TypeScript and in Python or Go (`fullStackSets` in `assets/data.js`). Per language, Senior means 75% of that tree's XP.

Each level shows a matching position and indicative salaries (`career` in `assets/data.js`): Germany gross per year in EUR (jobrise.io, 2026) and US base salary in USD (Scaler, 2026, citing BLS, PayScale and Glassdoor; interns from PayScale).

## The assistant chat

Every question passes two checks before the model answers:

1. **In the browser:** the question is matched against the concepts in your tree (`keywords` in `assets/data.js`). If it touches a concept you haven't verified, it never reaches the model.
2. **On the server:** the model first lists which concepts a good answer needs (`POST /api/chat`). If any of them isn't verified, or the question isn't about programming, it's declined. Only then does the model answer, with instructions to use only your verified concepts.

Without the local server or an API key (for example in a hosted copy), the first check still runs, and allowed questions show what your tree says about those concepts.

**Code changes always need your confirmation.** The chat has a "Your code" file. When the assistant changes it, the change arrives as a proposal with a line-by-line diff. Nothing is applied until you tick "I've read every changed line and I understand what it does" and press **Accept change**, or you can **Reject** it. If the proposed code uses a concept you haven't verified, it can't be accepted at all. There's no setting to skip this.

## Guided tasks

- **Library:** ready-made tasks for Python, TypeScript and Go (`library` in `assets/data.js`).
- **Describe your own:** pick the concepts to learn yourself, or, with the local server and an API key, leave them empty and the AI plans the steps (`POST /api/plan`).
- **Reset** starts a task over and locks again what its own checks unlocked. **Delete** removes the task but keeps the concepts you already unlocked through it.

## The AI gate

Every tutor request goes to `POST /api/assistant`. The server builds a system prompt from your verified concepts. That prompt tells the model to write code only with those concepts, to teach anything else instead, and to ask about missing details. In this demo the gate is prompt-based; a production version would also check the model's output.

## Demo limits

- Challenge "tests" check your code's structure with patterns. They don't run it. The real system would run code in a sandbox.
- People, tickets and dates are sample data.
- The two users (Alex the learner, Maria the manager) are fixed. There's no login.
