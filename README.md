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
