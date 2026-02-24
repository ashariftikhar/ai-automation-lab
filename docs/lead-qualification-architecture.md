# Lead Qualification Architecture

## Core Stack (Planned)

- Node.js backend
- Express API
- OpenAI API
- MongoDB (lead storage)
- Webhook integrations

---

## Processing Logic

1. Receive lead JSON
2. Format structured AI prompt
3. Get AI evaluation
4. Parse response
5. Store lead with:
   - Score
   - Intent
   - Recommendation
6. Trigger automation

---

## Design Principle

AI should assist decision-making, not replace structured logic.
