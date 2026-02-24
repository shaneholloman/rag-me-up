# 🚀 RAG Me Up - by [SensAI.PT](https://www.sensai.pt)

> A simple and extensible framework to build RAG (Retrieval-Augmented Generation) applications fast.

[![License](https://img.shields.io/github/license/ErikTromp/RAGMeUp?style=flat-square)](https://github.com/SensAI-PT/RAGMeUp/blob/main/LICENSE)
[![GitHub Repo stars](https://img.shields.io/github/stars/ErikTromp/RAGMeUp?style=social)](https://github.com/SensAI-PT/RAGMeUp/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/ErikTromp/RAGMeUp?style=flat-square)](https://github.com/SensAI-PT/RAGMeUp/issues)
[![Docs](https://img.shields.io/badge/docs-Docusaurus-blueviolet?logo=readthedocs&style=flat-square)](https://ragmeup.sensai.pt)

---

## ⚡ TL;DR – Installation & Quickstart

```bash
# Clone the repo
git clone https://github.com/SensAI-PT/RAGMeUp.git
cd RAGMeUp

# Create and populate your Docker env file
cp docker-compose.env.example docker-compose.env
# Edit docker-compose.env and set at least POSTGRES_PASSWORD and JWT_SECRET

# Build and start everything
docker compose --env-file docker-compose.env up --build -d
```

React UI is available on `http://localhost` (or the `HOST_PORT` you set in `docker-compose.env`).

> **Note:** The full Docker Compose setup runs the Python server in CPU-only mode (no GPU/CUDA access inside Docker). If you need GPU acceleration for embeddings and inference, use the hybrid mode below.

## 🖥️ Hybrid Mode – GPU Support

In hybrid mode, Postgres, the Node.js API server, and the React client run in Docker, while the **Python RAG server runs standalone** on the host where it has full access to your GPU/CUDA.

### 1. Start the Docker services (without the Python server)

```bash
cp docker-compose.env.example docker-compose.env
# Edit docker-compose.env — uncomment and adjust PYTHON_SERVER_URL and POSTGRES_PORT if needed

docker compose --env-file docker-compose.env \
  -f docker-compose.yml -f docker-compose.hybrid.yml up --build -d
```

This starts:
- **ParadeDB Postgres** – exposed on the host at `localhost:6024` (configurable via `POSTGRES_PORT`)
- **Node.js API server** – connects to your host Python server via `PYTHON_SERVER_URL` (default: `http://host.docker.internal:5000`)
- **React client (nginx)** – accessible at `http://localhost:HOST_PORT`

### 2. Run the Python RAG server on the host

```bash
cd server

# Set up a virtual environment (first time only)
python -m venv .venv
# Linux/macOS:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Make sure server/.env has:
#   postgres_uri="postgresql://langchain:langchain@localhost:6024/langchain"
#   embedding_cpu=False   (to use GPU)

python server.py
```

The Python server starts on port 5000 by default. The Dockerized Node server reaches it via `host.docker.internal:5000`.

> **Windows/macOS:** `host.docker.internal` works out of the box.
> **Linux:** Add `--add-host=host.docker.internal:host-gateway` to each service in the compose file, or set `PYTHON_SERVER_URL=http://172.17.0.1:5000` in `docker-compose.env`.

## 📘 Documentation
Full setup instructions, architecture docs, API references, and guides available at:

👉 https://ragmeup.sensai.pt


## 🧠 Why RAG Me Up?

⚙️ Modular: Use your own chunkers, vectorstores, or retrievers

🚀 Fast to prototype: Focus on your RAG logic, not boilerplate

🧩 Flexible: Plug-and-play architecture

✨ Battle-tested: RAG Me Up has been used in many large-scale production settings, most notably in [SensAI.PT - Your AI personal trainer](https://www.sensai.pt)

## 🤝 Contributing
We welcome pull requests, feedback, and ideas.
Open an issue or start a discussion to get involved.
