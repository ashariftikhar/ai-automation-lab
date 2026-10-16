# AI Automation Lab: Production AI Lead Qualification & Intent Scoring Suite

[![Ashflow Ecosystem](https://img.shields.io/badge/Ecosystem-Ashflow.site-6366f1?style=for-the-badge&logo=fastapi&logoColor=white)](https://ashflow.site)
[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge&logo=github)](https://ashariftikhar.github.io/ai-automation-lab/)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen?style=for-the-badge&logo=node.js&logoColor=white)](https://github.com/ashariftikhar/ai-automation-lab)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Language](https://img.shields.io/badge/JavaScript-Node.js%20Native-orange?style=for-the-badge&logo=javascript)](https://nodejs.org)

---

## 🎯 Live Demo

Experience the interactive AI Lead Qualification Engine in your browser or directly in your terminal:

[![Open Live Demo](https://img.shields.io/badge/Open-Web%20Demo-brightgreen?style=for-the-badge&logo=github)](https://ashariftikhar.github.io/ai-automation-lab/)

```bash
# Run the interactive colorized CLI demo (evaluates 5 real-world simulated leads)
npm run demo
# or
node tools/lead-scoring-engine.js --demo
```

---

## 🔬 Project Overview

A production-grade research and development environment engineered by **[Ashflow](https://ashflow.site)** for building scalable, high-conversion **AI Lead Qualification & Intent Scoring Systems**.

This platform solves the common business problem of sales teams wasting time on low-intent inquiries, budget mismatches, and bot submissions by automating:

- Multi-dimensional lead scoring with strict mathematical weighting
- Automated bot and spam disqualification filtering
- Intent category tiering (HOT, WARM, COLD, UNQUALIFIED)
- Instant SLA-driven action recommendations (calendar booking, SMS alerts, case studies, educational nurture, or polite rejection)
- Native HTTP webhook processing for CRM pipelines (HubSpot, GoHighLevel, Salesforce, Zapier, Make)
- LLM prompt engineering architectures for OpenAI and Claude

---

## 📊 Mathematical Scoring Rubric

The qualification engine calculates a normalized composite score ($0 \le S_{\text{total}} \le 100$) using five weighted dimensions:

$$\text{Lead Score} = \sum_{i} w_i \cdot S_i = (w_b \cdot S_b) + (w_u \cdot S_u) + (w_c \cdot S_c) + (w_f \cdot S_f) + (w_a \cdot S_a)$$

$$\sum_{i} w_i = 0.30 + 0.25 + 0.20 + 0.15 + 0.10 = 1.00 \quad (100\%)$$

| Dimension | Weight ($w$) | Description | Scoring Scale ($0 - 100$) |
| :--- | :---: | :--- | :--- |
| **Budget** ($S_b$) | **0.30** | Financial capacity & resource commitment | $\ge \$10\text{k}: 100$ pts \| $\$5\text{k}-\$10\text{k}: 80$ pts \| $\$2.5\text{k}-\$5\text{k}: 60$ pts \| $\$1\text{k}-\$2.5\text{k}: 40$ pts \| $<\$500: 0$ pts |
| **Urgency** ($S_u$) | **0.25** | Timeline to contract or deployment | Immediate / $<48\text{h}: 100$ pts \| $1-2\text{ weeks}: 75$ pts \| $1\text{ month}: 50$ pts \| $1-3\text{ months}: 25$ pts \| Browsing: $0$ pts |
| **Project Clarity** ($S_c$) | **0.20** | Scope specificity & architectural detail | Clear specs & deliverables: $100$ pts \| Moderate scope: $70$ pts \| Vague idea: $35$ pts \| Undefined: $0$ pts |
| **ICP / Industry Fit** ($S_f$) | **0.15** | Alignment with core Ashflow target markets | Core ICP (HVAC, Roofing, Dental, B2B SaaS, E-Com): $100$ pts \| Secondary: $65$ pts \| Non-fit / Student: $0$ pts |
| **Authority** ($S_a$) | **0.10** | Purchasing power of contact person | C-Suite / Founder / Owner: $100$ pts \| VP / Director: $85$ pts \| Manager: $55$ pts \| Non-buyer / Intern: $0$ pts |

### 🚫 Spam & Bot Disqualification Penalty
Submissions triggering honeypot traps, disposable email domains (e.g. `tempmail.com`), malicious keywords (e.g. casino backlinks, crypto spam), or explicit spam flags receive an immediate **disqualification penalty**:
- Final Score: **0 / 100**
- Category: **UNQUALIFIED (DISQUALIFIED)**
- Reason logged in CRM audit trail

---

## 🚦 Intent Categories & Automated Routing

Based on the calculated score, the lead is automatically categorized and routed to targeted follow-up workflows:

| Category | Score Range | Priority & SLA | Automated Action Recommendation | Channel |
| :--- | :---: | :---: | :--- | :--- |
| 🔥 **HOT** | **$\ge 75$** | **P1** (< 15 mins) | **Instant calendar booking link + immediate SMS notification.** | SMS + Calendar Link |
| ⚡ **WARM** | **$50 - 74$** | **P2** (2 - 4 hours) | **Automated email nurture sequence + case study delivery.** | Automated Email Drip |
| ❄️ **COLD** | **$25 - 49$** | **P3** (24 hours) | **Educational lead magnet download.** | Resource Auto-Delivery |
| 🚫 **UNQUALIFIED** | **$< 25$** | **P4** (Instant) | **Courteous rejection / redirection.** | Polite Auto-Response |

---

## 🧩 Lab Structure

```text
ai-automation-lab/
│
├── tools/
│   └── lead-scoring-engine.js      → Multi-dimensional scoring engine & CLI demo
│
├── workflows/
│   ├── crm-webhook-handler.js      → Lightweight native HTTP webhook listener
│   └── ai-lead-qualification-system.md → Workflow specifications & logic architecture
│
├── tests/
│   └── lead-scoring.test.js        → Automated test suite (node:test & node:assert)
│
├── prompts/
│   ├── lead-qualification-system-prompt.md → Structured extraction prompt for OpenAI/Claude
│   └── response-strategy-prompt.md → Tiered high-conversion response drafting prompt
│
├── docs/
│   ├── index.html                  → Web demo interface
│   ├── script.js                   → Frontend logic
│   ├── style.css                   → UI styling
│   └── lead-qualification-architecture.md
│
├── package.json                    → Test, demo, and start scripts
└── README.md                       → Lab documentation & formulas
```

---

## 🛠 Tech Stack

![Node.js](https://img.shields.io/badge/Node.js-24+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![OpenAI](https://img.shields.io/badge/OpenAI-API-000000?style=for-the-badge&logo=openai&logoColor=white)
![Claude](https://img.shields.io/badge/Anthropic-Claude%203.5-D97706?style=for-the-badge&logo=anthropic&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-Semantic-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Modern-1572B6?style=for-the-badge&logo=css3&logoColor=white)

---

## 💻 CLI Demo & Testing Guide

### 1. Run Unit Tests (100% Native)
Run the automated test suite using Node's native test runner (zero external dependencies required):
```bash
npm test
# or
node --test tests/lead-scoring.test.js
```

### 2. Run Interactive CLI Demo
Evaluate 5 simulated real-world leads (Roofing contractor, Dental clinic, Enterprise SaaS, Low-budget spammer, Urgent HVAC lead) with colorized terminal output:
```bash
npm run demo
# or
node tools/lead-scoring-engine.js --demo
```

---

## 🔌 Native CRM Webhook Integration

The repository includes a lightweight, zero-dependency HTTP webhook listener ready to ingest leads from website contact forms, webhooks, or CRM tools:

### Start the Webhook Listener:
```bash
npm start
# Server listens on port 3000 (or process.env.PORT)
```

### Inbound POST Request Example:
```bash
curl -X POST http://localhost:3000/webhook/lead \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marcus Vance",
    "company": "Apex Peak Roofing",
    "email": "marcus@apexpeakroofing.com",
    "role": "Owner & General Manager",
    "industry": "Roofing & Exterior Contracting",
    "budget": 6500,
    "urgency": "high",
    "projectClarity": "clear"
  }'
```

### Webhook JSON Response:
```json
{
  "success": true,
  "message": "Lead scored and classified successfully",
  "leadId": "lead_1792174029273_16sub",
  "timestamp": "2026-10-16T18:07:09.274Z",
  "evaluation": {
    "score": 94,
    "category": "HOT",
    "disqualified": false,
    "action": "Instant calendar booking link + immediate SMS notification.",
    "sla": "< 15 minutes",
    "channel": "SMS + Calendar Invite",
    "priority": "P1 - High Priority Sales Desk"
  }
}
```

---

## 📝 Production Prompt Frameworks

Explore the battle-tested prompt architectures located in `prompts/`:

1. **[Lead Qualification System Prompt](prompts/lead-qualification-system-prompt.md)**: Structured prompt instructing OpenAI / Claude to ingest raw conversation or form transcripts and return deterministic JSON conforming to our scoring schema.
2. **[Response Strategy Prompt](prompts/response-strategy-prompt.md)**: Context-aware follow-up drafting prompt that personalizes multi-channel responses (SMS + Email) tailored strictly to the lead's calculated tier.

---

## 🚀 Production Status

- ✅ Multi-dimensional mathematical scoring engine implemented
- ✅ Honeypot, disposable email, and spam detection filters verified
- ✅ 100% automated test coverage with Node.js native test runner
- ✅ Webhook HTTP listener with native routing & health check
- ✅ Production prompt engineering frameworks added
- ✅ Interactive frontend web demo live on GitHub Pages

---

## 📫 Contact & Ecosystem

*   **Founder:** Ashar Iftikhar
*   **Agency Platform:** [Ashflow](https://ashflow.site)
*   **Work Email:** [ashar@ashflow.site](mailto:ashar@ashflow.site)
*   **LinkedIn:** [/in/ashariftikharofficial](https://www.linkedin.com/in/ashariftikharofficial)
*   **X (Twitter):** [@AsharIftikkhar](https://x.com/AsharIftikkhar)
*   **Location:** Global / Remote
