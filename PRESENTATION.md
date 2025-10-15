# MyFlow Presentation
## Context-Switching Companion for the Modern Professional

---

## Slide 1: The Problem - Digital Nomads of Context

**We're all digital nomads - but not in the way you think.**

You're not traveling across countries. You're traveling across **contexts** throughout your day:

- 🏢 **Morning-You**: Deep work on that critical project
- 📧 **Noon-You**: Back-to-back meetings and emails  
- 👨‍👩‍👧 **Evening-You**: Family time and personal tasks
- 🧘 **Night-You**: Rest and recharge

**Traditional productivity apps fail here.** They show you everything, all the time. Work tasks bleed into family time. Personal errands interrupt deep work. You're drowning in a master list that doesn't respect which version of yourself you need to be **right now**.

> **MyFlow is built for people who switch contexts constantly and need their tools to switch with them - not against them.**

---

## Slide 2: The Solution - Intelligent Context Management

**MyFlow isn't just another TODO app. It's your context-switching companion.**

### 🎯 Core Innovation: Context-First, Not Task-First

Instead of showing you 47 tasks across every area of your life, MyFlow asks:

**"Who do you want to be right now?"**

Then it shows you **only the 3-5 things that matter** in that context.

### 🤖 AI-Powered Conversation Interface

Forget manual task entry. Just talk:

```
You: "I need to finish the presentation for Friday and email Sarah about the project"

AI: "Got it. I'll add both to your Work Flow. I see you have a meeting with 
     Sarah Thursday - want to prep that email beforehand?"

You: "Yes, schedule it for Thursday morning"

AI: "Done. Added to Work Flow for Thursday 9am."
```

**The magic:** Your conversation is the interface. Tasks emerge naturally from what you say.

### 🔄 Transition Intelligence

When you switch from Work Flow to Personal Flow:

```
AI: "How did Work Flow go? You completed 4 of 5 flows - nice work."

AI: "I see your wife emailed about the kids' school event. 
     Ready to handle that in Personal Flow?"
```

**MyFlow shines at the moments other apps ignore** - the transitions between contexts.

---

## Slide 3: How It Works - The Full Stack

### 🏗️ Technical Architecture

**Frontend (Next.js 15 + React 19)**
- Server-first rendering with React Server Components
- CSS Design Tokens for consistent styling
- Real-time streaming AI responses
- Responsive, accessible UI (WCAG AA)

**Backend (FastAPI + Python 3.12)**
- RESTful API with async MongoDB (Motor)
- JWT authentication via Logto
- Multi-provider AI integration (OpenAI + Anthropic)
- 80%+ test coverage with pytest

**Database (MongoDB Atlas)**
- User contexts with mock contextual data
- Flows (tasks) organized by context
- Conversation history for AI learning
- All data encrypted at rest

### 🔐 Security & Performance

- Authentication: Logto OAuth 2.0 with JWT tokens
- API response times: <200ms for CRUD operations
- AI streaming: <2 second response latency
- Context switching: <500ms to maintain flow state

### 📊 Data Model Intelligence

Each context stores:
- **Flows**: The actionable items (tasks under the hood)
- **Conversations**: Full AI chat history for pattern learning
- **Mock Context Data**: Simulated meetings, emails, appointments (for MVP)
  - Future: Real integrations with Calendar, Gmail, Slack via MCP

---

## Slide 4: The User Experience - A Day in the Life

### Morning: Starting Your Day

```
🌅 User opens MyFlow

AI: "Good morning! Ready to start your day? 
     Which flow do you want to begin with?"

User selects: Work Flow

📅 Context Panel shows:
   • 10:00am - Team Standup (in 2 hours)
   • 2:00pm - Client Presentation
   • 3 incomplete flows from yesterday

AI: "Want to prep for that client presentation? 
     You usually need about 90 minutes."

User: "Yes, add that"

AI: "Added 'Prep client presentation' to Work Flow. 
     I'll remind you to start at 12:30pm."
```

### Midday: Context Switch

```
🍽️ User clicks "Switch Context" → Personal Flow

AI: "How did Work Flow go this morning?"

User: "Good, got the prep done"

AI: "Nice! Switching to Personal Flow. 
     You have a doctor's appointment that needs scheduling. 
     Want to handle that now?"

📱 Personal Flow shows:
   • Schedule doctor appointment
   • Call Mom (birthday tomorrow)
   • Plan grocery list
```

### Evening: Reflection

```
🌙 User switches to Rest Flow

AI: "You've been in Work Flow for 8 hours today. 
     Your Rest Flow needs some attention. Ready to unwind?"

🧘 Rest Flow shows:
   • 30-minute meditation
   • Read chapter of that book
   • Early bedtime tonight

AI: "You mentioned feeling stressed this week. 
     Want to talk about it or just focus on relaxing?"
```

### The Key Difference

**Traditional TODO apps:** "Here are all 47 tasks across your entire life. Good luck!"

**MyFlow:** "Right now, you're in Work mode. Here are the 3 things that matter most. Everything else can wait."

---

## Slide 5: Why This Matters - The Bigger Picture

### 🎓 Meeting the Assignment (And Exceeding It)

**Required:** Full-stack TODO app with tasks, labels, auth, and persistence

**Delivered:** Context-aware flow companion with AI intelligence

| Requirement | Traditional Approach | MyFlow's Approach |
|------------|---------------------|-------------------|
| **Tasks** | Plain text items in a list | AI-extracted "flows" from conversation |
| **Labels** | Manual tags like "work" or "urgent" | Intelligent contexts with transition support |
| **Auth** | Basic login/logout | OAuth 2.0 via Logto with session management |
| **Persistence** | Save/load from database | MongoDB with full conversation history |
| **Extra** | Maybe filters or sorting | Real-time AI, context intelligence, transition guidance |

### 💡 The Innovation

**We reframed the problem:**
- Assignment: "Build a TODO app"
- Our answer: "What if the app understood *who* you need to be, not just *what* you need to do?"

**The result:** Same technical requirements, completely different user experience.

### 🚀 Future Vision

**Phase 2: Real Integrations**
- Connect Google Calendar, Gmail, Slack via MCP
- Automatic context suggestions based on calendar
- Smart notifications at transition points

**Phase 3: Advanced AI**
- Pattern recognition: "You usually do deep work Tuesday mornings"
- Predictive context switching: "Looks like you're wrapping up Work Flow early today"
- Personalized productivity insights

**Phase 4: Beyond Productivity**
- Mood tracking and energy level correlation
- Burnout prevention through balanced context time
- Team/family shared contexts for coordination

### 🎯 The Core Message

> **Most productivity tools ask: "What do you need to do?"**
>
> **MyFlow asks: "Who do you want to be right now?"**

We're not helping people do more tasks.

We're helping people **be more intentional** about how they show up in each moment.

---

## Tech Stack Summary

**Frontend**
- Next.js 15 (App Router)
- React 19 (Server Components)
- TypeScript 5.6+ (strict mode)
- Tailwind CSS 4.x + CSS tokens
- shadcn/ui (Radix primitives)
- TanStack Query (server state)
- Vitest + Playwright (testing)

**Backend**
- Python 3.12+ with FastAPI 0.115+
- Motor (async MongoDB driver)
- Pydantic v2 (validation)
- OpenAI + Anthropic APIs
- Logto SDK (auth)
- pytest + pytest-asyncio (testing)

**Infrastructure**
- MongoDB Atlas (free tier)
- Vercel (frontend deployment)
- Railway/Render (backend deployment)
- 1Password CLI (secret management)

---

## Current Project Status

✅ **Epic 1: Complete** - Foundation & Auth (5 stories)
✅ **Epic 2: Complete** - Context & Data Layer (9 stories)  
✅ **Epic 3: Complete** - AI Conversation Interface (8 stories)
🚧 **Epic 4: In Progress** - Transition Intelligence (6 stories)
⏳ **Epic 5: Planned** - Testing, Performance & Deployment

**Test Coverage:**
- Frontend: 70%+ (unit + integration with Vitest)
- Backend: 80%+ (unit + integration with pytest)
- E2E: Critical user journeys with Playwright

**Lines of Code:** ~15,000+ across frontend/backend

---

## Key Differentiators

### 1️⃣ Context-First Design
Not "show me all my tasks" but "show me what matters **right now**"

### 2️⃣ Transition Intelligence  
The app shines during context switches - helping you reflect and reset intentionally

### 3️⃣ AI as Companion
Conversation is the primary interface. The AI learns your patterns and guides you.

### 4️⃣ Intentional Scarcity
Show less (3-5 items) so you can focus more. Reduce overwhelm, increase clarity.

### 5️⃣ Respect for Boundaries
Work stays in Work Flow. Personal stays in Personal Flow. No bleeding between contexts.

---

## Demo Points

1. **Show the onboarding:** AI asks about your typical day, suggests contexts
2. **Demonstrate conversation:** Natural language → structured flows
3. **Context switching:** Watch the transition prompts and context-specific views
4. **Show the data panel:** Mock meetings, emails appearing in context
5. **Complete a flow:** Mark done, see it reflected in context stats

**The "Wow" Moment:** When you switch contexts and the AI says:
> "You mentioned stress in your Work Flow earlier. Want to talk about that in Rest Flow, or just unwind?"

**That's when they get it.** The app isn't just organizing tasks - it's **understanding you**.

---

## Questions to Anticipate

**Q: "Isn't this just another TODO app with labels?"**

**A:** Under the hood, yes - contexts are labels, flows are tasks. But the UX completely transforms the experience. It's like saying "Isn't Uber just a taxi?" Technically true, but it misses the point entirely.

---

**Q: "What about privacy? You're storing conversations."**

**A:** All data is encrypted at rest in MongoDB. JWT tokens for auth. User data isolated per account. In production, we'd add: end-to-end encryption options, data export/deletion, and GDPR compliance.

---

**Q: "Why not just use Google Tasks or Todoist?"**

**A:** Those apps force you to organize tasks into their structure. MyFlow adapts to how you naturally think. You don't "add a task to the Work list" - you just talk about what's on your mind, and the app extracts the actionable pieces and puts them in the right context.

---

**Q: "How does the AI handle context detection?"**

**A:** For MVP, users manually switch contexts. The AI then responds contextually based on which mode you're in. Phase 2 adds automatic context detection using calendar data, time of day patterns, and user behavior learning.

---

## Closing

**MyFlow transforms the boring TODO app assignment into something people might actually want to use.**

It demonstrates:
- ✅ Full-stack technical skills (Next.js, FastAPI, MongoDB)
- ✅ Modern architecture patterns (RSC, async Python, design tokens)
- ✅ AI integration (not just buzzwords - real conversational intelligence)
- ✅ Product thinking (reframing the problem space)
- ✅ UX design (intentional scarcity, transition awareness)

**Most importantly:** It solves a real problem for people who feel pulled in multiple directions every day.

> **"This is productivity for people who are tired of productivity apps."**

---

**Thank you!** Questions?

📧 Contact: [Your contact info]  
🔗 GitHub: [Repository link]  
📊 Live Demo: [Demo URL when deployed]


