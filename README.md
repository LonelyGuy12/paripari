# PariPari 🚀 - The Repo-Aware AI Copilot

[![Built with Paritok](https://img.shields.io/badge/Built%20with-Paritok-1f2d3d)](https://github.com/Paritok-official/paritok-4b-v1)

PariPari is an intelligent, repository-aware AI Copilot designed to help you quickly understand codebases, track down bugs, and propose patches. 

What makes PariPari special is its integration with **Paritok Compression**. Instead of using compression merely as a cost-optimization hack, PariPari uses Paritok as a **structural capability enabler**. It maps the *entire* architecture of massive monorepos into a tiny token footprint, giving the agent true omniscient repository awareness.

## 🌟 Features

- **Offline Semantic Indexing**: PariPari can crawl your entire GitHub repository and compress each file into a concise, semantic map using Paritok. This creates a persistent compressed knowledge structure of your whole codebase.
- **Top-Down Agent Navigation**: When you ask a question, the agent doesn't blindly grep file-by-file. It ingests the compressed semantic map instantly, allowing it to navigate massive repositories (e.g., thousands of files) for fractions of a cent, isolating the specific files it needs to read uncompressed.
- **Massive Cost Savings & Telemetry**: A beautiful real-time telemetry dashboard tracks your compression ratio and estimated USD saved vs. sending uncompressed text to the LLM. 
- **Bulletproof Error Recovery**: Employs robust API-layer formatting recovery loops to prevent the AI from crashing during live tool-use edge cases.
- **Classic Dynamic UI/UX**: A highly polished, sleek dark-mode Next.js frontend featuring smooth Framer Motion animations, refined glassmorphic accents, and a premium, clean aesthetic.

## 🏗️ Architecture

PariPari is a full-stack application split into two main components:

- **Frontend**: Next.js 16 (React 19), Tailwind CSS v4, Framer Motion, Lucide React, React-Markdown.
- **Backend**: Python, FastAPI, Uvicorn, AsyncOpenAI (configured to use Groq's fast Llama-3.3-70b-versatile model).

## 🚀 Getting Started

### Prerequisites
- Node.js & npm (for frontend)
- Python 3.9+ (for backend)
- API Keys: Paritok API Key and a Groq API Key.

### 1. Backend Setup (FastAPI)
Navigate to the backend directory and set up your virtual environment:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Ensure your `.env` is configured correctly with your API keys (an example is provided in `.env.example`).

Start the backend server:
```bash
python -m uvicorn main:app --reload
```
The backend will run on `http://127.0.0.1:8000`.

### 2. Frontend Setup (Next.js)
Open a new terminal window, navigate to the frontend directory, and install dependencies:

```bash
cd frontend
npm install
```

Start the development server:
```bash
npm run dev
```
The frontend will be available at `http://localhost:3000`.

## 💻 How it works (The Pitch)

The real problem for AI Agents isn't writing code—it's that they **cannot hold entire codebases in their context windows**. 

Here is how PariPari solves that:
1. **Dynamic On-the-Fly Indexing**: If you query a new repository, PariPari triggers a background script that recursively sends all files to Paritok, returning a massively compressed JSON semantic map of the repo.
2. **Instant Structural Awareness**: PariPari injects this map (which condenses millions of raw tokens into ~15k tokens) into the LLM context.
3. **Surgical Precision**: The LLM reads the map, immediately understands where the relevant logic lives, and calls `read_file` only on the specific files required to write the patch.
4. **Final Delivery**: PariPari streams a proposed fix and a PR summary directly to the beautiful chat interface.

## 📄 License

This project is licensed under the [Apache License 2.0](./LICENSE).

Built with [Paritok](https://github.com/Paritok-official/paritok-4b-v1).
