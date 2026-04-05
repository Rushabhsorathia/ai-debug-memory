<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20-green?logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/MCP-Protocol-blueviolet" alt="MCP" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License" />
</p>

<h1 align="center">🐛 AI Debug Memory</h1>

<p align="center"><strong>Never explain the same bug twice.</strong></p>

<p align="center">
  Your personal bug fix database with MCP support.<br/>
  Store every bug you solve → instantly find the fix next time → sync across Cursor, Windsurf, and Claude.
</p>

---

## 🎯 The Problem

You hit a `JsonWebTokenError`. Google it. Find the fix. Move on.

Three weeks later — **same error, different project**. Google again. Another 30 minutes gone.

AI tools have no persistent memory of your bug fixes. Every session starts fresh.

**AI Debug Memory fixes this.**

---

## ✨ Features

| Feature | Description |
|---|---|
| **Store Bug Fixes** | Save error + fix + context with one command or API call |
| **Smart Matching** | Fuzzy + full-text search finds the right fix instantly |
| **Success Tracking** | Track which fixes work and which don't |
| **MCP Integration** | Works directly in Cursor, Windsurf, Claude Desktop |
| **CLI Tool** | `dm find "error"` / `dm store` / `dm list` / `dm stats` |
| **Auto Extraction** | Extracts error type, code, file from raw messages |
| **Docker Ready** | One command to start everything |

---

## 🏗️ Architecture

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Cursor  │  │ Windsurf │  │  Claude  │  │   CLI    │
│  (MCP)   │  │  (MCP)   │  │  (MCP)   │  │  dm      │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     └──────────────┴──────────────┴─────────────┘
                         │
               ┌─────────▼──────────┐
               │  Express + MCP     │
               │  Port: 3457        │
               │                    │
               │  Tools:            │
               │  - store_bug_fix   │
               │  - find_fix        │
               │  - list_fixes      │
               │  - update_fix      │
               │  - search_bugs     │
               └─────────┬──────────┘
                         │
               ┌─────────▼──────────┐
               │  MongoDB 7         │
               │  (Bug Fixes DB)    │
               └────────────────────┘
```

---

## 🚀 Quick Start

```bash
git clone https://github.com/Rushabhsorathia/ai-debug-memory.git
cd ai-debug-memory

cp .env.example .env
docker compose up -d
```

Server runs on **http://localhost:3457**

### Store a Bug Fix

```bash
curl -X POST http://localhost:3457/api/v1/bugs \
  -H "Content-Type: application/json" \
  -H "x-api-key: dm_sk_debugmemory_2026_rushabh_secure_key" \
  -d '{
    "error": {
      "raw_message": "JsonWebTokenError: invalid signature",
      "file_path": "src/middleware/auth.js",
      "line_number": 42
    },
    "environment": {
      "language": "javascript",
      "framework": "Express.js"
    },
    "fix": {
      "description": "JWT_SECRET must use Buffer.from() for RS256 algorithm",
      "code_before": "jwt.verify(token, process.env.JWT_SECRET)",
      "code_after": "jwt.verify(token, Buffer.from(process.env.JWT_SECRET, \"base64\"))",
      "fix_type": "code_change",
      "steps": [
        "Check JWT_SECRET is base64 encoded in .env",
        "Wrap JWT_SECRET in Buffer.from()",
        "Restart server"
      ]
    },
    "tags": ["jwt", "auth", "express"]
  }'
```

### Find a Fix

```bash
curl -X POST http://localhost:3457/api/v1/search \
  -H "Content-Type: application/json" \
  -H "x-api-key: dm_sk_debugmemory_2026_rushabh_secure_key" \
  -d '{"error_message": "JsonWebTokenError: invalid signature"}'
```

Returns 100% match in ~10ms.

---

## 🔌 MCP Client Setup

### Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "debug-memory": {
      "url": "http://localhost:3457/mcp"
    }
  }
}
```

### Windsurf (`~/.windsurf/mcp_config.json`)

```json
{
  "mcpServers": {
    "debug-memory": {
      "url": "http://localhost:3457/mcp"
    }
  }
}
```

### Claude Desktop

```json
{
  "mcpServers": {
    "debug-memory": {
      "url": "http://localhost:3457/mcp"
    }
  }
}
```

Then in your AI chat:

> "Use find_fix for error 'JsonWebTokenError: invalid signature'"

The AI fetches your stored fix instantly.

---

## 🖥️ CLI Tool

```bash
# Find a fix
dm find "ECONNREFUSED 127.0.0.1:27017"

# Find with filters
dm find "JsonWebTokenError" --lang javascript --framework Express

# Store a fix (interactive)
dm store

# List all fixes
dm list
dm list --lang javascript

# View stats
dm stats
```

---

## 📡 API Reference

### REST API (`/api/v1`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/bugs` | Store new bug + fix |
| `GET` | `/bugs` | List all fixes (paginated) |
| `GET` | `/bugs/:bugId` | Get specific fix |
| `PUT` | `/bugs/:bugId` | Update fix |
| `DELETE` | `/bugs/:bugId` | Delete a fix |
| `POST` | `/bugs/:bugId/feedback` | Mark fix as worked/failed |
| `POST` | `/search` | Search for matching fix |
| `GET` | `/stats` | Most common bugs, success rates |
| `GET` | `/health` | Health check |

### MCP Tools

| Tool | Description |
|------|-------------|
| `store_bug_fix` | Save a bug fix with error details + solution |
| `find_fix` | Smart search for matching fix with scoring |
| `list_fixes` | List all stored fixes with filters |
| `update_fix` | Mark fix as worked/failed (updates success rate) |
| `search_bugs` | Full-text search across all fixes |

---

## 📁 Project Structure

```
ai-debug-memory/
├── src/
│   ├── server.js               # Express + MCP server
│   ├── mcp/
│   │   ├── index.js            # MCP Server setup
│   │   └── tools/
│   │       ├── storeBugFix.js  # Store bug + fix
│   │       ├── findFix.js      # Smart search
│   │       ├── listFixes.js    # List with filters
│   │       ├── updateFix.js    # Feedback (worked/failed)
│   │       └── searchBugs.js   # Full-text search
│   ├── routes/
│   │   ├── bugs.routes.js      # CRUD endpoints
│   │   ├── search.routes.js    # Search endpoint
│   │   └── stats.routes.js     # Stats endpoint
│   ├── models/
│   │   ├── BugFix.model.js     # Main schema + text index
│   │   └── SearchLog.model.js  # Search analytics
│   ├── services/
│   │   ├── matching.service.js # Fuzzy match + scoring
│   │   ├── extractor.service.js# Auto error extraction
│   │   └── mongo.service.js    # DB connection
│   ├── middleware/
│   │   ├── auth.middleware.js  # API key auth
│   │   └── rateLimit.js        # Rate limiter
│   └── utils/
│       ├── logger.js           # Winston logger
│       └── errorParser.js      # Stack trace parser
├── cli/
│   └── debug-memory.js         # CLI: dm find/store/list/stats
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 🗄️ Database Schema

### `bug_fixes` Collection

| Field | Type | Description |
|-------|------|-------------|
| `bug_id` | String | Unique identifier |
| `error.raw_message` | String | Full error message (text-indexed) |
| `error.error_type` | String | Auto-extracted (TypeError, ReferenceError, etc.) |
| `error.error_code` | String | Auto-extracted (ECONNREFUSED, ENOENT, etc.) |
| `error.file_path` | String | Where the error occurred |
| `environment.language` | String | javascript, php, python, typescript, etc. |
| `environment.framework` | String | Express, Laravel, React, Next.js |
| `fix.description` | String | Plain English fix (text-indexed) |
| `fix.code_before` | String | Broken code snippet |
| `fix.code_after` | String | Fixed code snippet |
| `fix.steps` | [String] | Step-by-step instructions |
| `fix.fix_type` | String | config, code_change, dependency, env_variable |
| `tags` | [String] | Keywords (text-indexed) |
| `success_count` | Number | Times this fix worked |
| `fail_count` | Number | Times this fix didn't work |
| `success_rate` | Number | Percentage success rate |

---

## 🧠 Smart Matching Engine

The matching engine uses a 3-tier approach:

1. **MongoDB Full-Text Search** — searches error messages, descriptions, and tags
2. **Jaccard Similarity** — scores results by word overlap with your query
3. **Boost Scoring** — framework matches get +10, high success rates get boosted

Only fixes above 30% match score are returned, sorted by relevance.

---

## 🐳 Docker Commands

```bash
docker compose up -d          # Start
docker compose down           # Stop
docker compose logs -f app    # View logs
docker compose up -d --build  # Rebuild after code changes
curl http://localhost:3457/health  # Health check
```

---

## 🔒 Security

- **API Key Auth** on all endpoints
- **Rate Limiting** — 300 requests per 15 minutes
- **Helmet** — Security headers
- **Local-first** — No data leaves your machine

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3457` | Server port |
| `MONGO_URI` | `mongodb://mongo:27017/ai_debug_memory` | MongoDB connection |
| `API_KEY` | — | API key for authentication |
| `LOG_LEVEL` | `info` | Logging level |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js 20** | Runtime |
| **Express.js** | REST API |
| **MongoDB 7** | Database with full-text search |
| **Mongoose** | MongoDB ODM |
| **MCP SDK** | Model Context Protocol |
| **Zod** | Schema validation |
| **Winston** | Logging |
| **Commander** | CLI framework |
| **Docker** | Containerization |

---

## 📜 License

MIT License — free to use, modify, and distribute.

---

<p align="center">
  Built by <a href="https://github.com/Rushabhsorathia">Rushabh Sorathiya</a> · 
  <a href="https://github.com/Rushabhsorathia/ai-debug-memory">⭐ Star this repo</a> if you find it useful!
</p>
