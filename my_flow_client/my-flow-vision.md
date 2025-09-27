# My Flow — Project Overview (High-Level)

## Vision

_My Flow_ is an AI-powered **context-switching companion**. Instead of managing long task lists, it helps people **move intentionally** between the different versions of themselves throughout the day—Work‑You, Personal‑You, Rest‑You, Social‑You. The app focuses on **transitions** and **awareness**, not just on doing more.

## Purpose

Modern life demands constant context switching. Most productivity apps add friction with bigger lists, more metadata, and heavier workflows. _My Flow_ reduces cognitive load by:

- Helping users **choose a context** deliberately (Work, Personal, Rest, Social/Creative).
- **Surfacing only what matters** in that context (3–5 items max).
- **Guiding transitions** with brief, reflective prompts that build intention and momentum.
- **Learning patterns** over time to personalize nudges and suggestions.

## Who It’s For

People who regularly juggle multiple roles and feel pulled in different directions:

- Students balancing classes, work, and life.
- Professionals switching between deep work, meetings, and family.
- Creatives managing bursts of energy with downtime.
- Anyone who wants to be **more intentional** about how they show up in each moment.

## What It Is (At a Glance)

- **Context‑first**, not task‑first.
- **Transitions‑aware**: entering, exiting, and switching contexts are first-class moments.
- **AI‑assisted conversation**: the primary way users express intent; the app translates thoughts into lightweight “flows” (tasks under the hood).
- **Intentional scarcity**: the interface shows less, so users can do more of what matters.

---

# MVP — The Simplest Version That Still Feels Magical

## MVP Goal

Prove that a context‑switching assistant can feel more useful and humane than a traditional to‑do list, while meeting course requirements (auth, REST API, persistence, tasks/labels).

## Core MVP Elements (Non‑Technical)

1. **Contexts (3–4 to start)**
   Work, Personal, Rest, and optional Social/Creative. These are “frames of self.”

2. **AI Conversation**
   A simple chat where users say what’s on their mind; the AI:
   - Helps identify/confirm the current context.
   - Extracts intentions and turns them into **flows** (stored as tasks under the hood).
   - Asks brief clarifying questions (due date, priority, which context).

3. **Context View (not Task View)**
   Opening a context reveals **3–5 relevant flows** for that mode—no overwhelming master list.

4. **Transition Moments**
   When switching contexts, the AI prompts quick reflection:
   - Entering: “Welcome to Work Flow. Anything from this morning to carry forward?”
   - Exiting: “How did that go? Ready to shift to Personal Flow?”

## MVP User Journey

- **Sign up & Onboard**: AI asks about the user’s typical day and suggests 3–4 contexts. It captures a few initial intentions per context.
- **Daily Use**: User selects a context (e.g., Work Flow), sees a focused view (3–5 flows), and can add/edit flows via chat at any time.
- **Switching Contexts**: User taps “Switch Context.” AI offers a short reflection and sets up the next context intentionally.
- **End of Day/Week**: A light reflection (“You spent most of today in Work Flow; want more balance tomorrow?”). Strictly optional.

## Scope (In vs. Out for MVP)

**In Scope**

- Authentication (sign up / log in)
- Predefined contexts + manual context switching
- Conversational flow creation (AI converts natural language → flows)
- Context views that show only 3–5 items
- Simple reflection prompts on transitions
- Basic flow management (mark done, edit text)

**Out of Scope (for later)**

- Automatic context detection
- Real integrations (Calendar, Email, Slack)
- Detailed analytics and pattern learning
- Collaboration, notifications, or advanced scheduling
- Mobile apps and push notifications

## Success Criteria

- **Usefulness**: Test users say it feels different from a to‑do app and helps them be more intentional.
- **Simplicity**: Users can complete a day with 2–3 context switches without feeling overwhelmed.
- **Engagement**: Users interact with the AI during transitions (brief check‑ins, not long chats).

## Why It’s Different

- **Context‑first**: The app adapts to who you are **right now**.
- **Transition‑aware**: The product shines at the moments other apps ignore.
- **AI as companion**: The conversation is the front door; lists are supporting cast.
- **Intentional scarcity**: Limited visible items reduce anxiety and increase clarity.

## The Demo Pitch (Short)

> “Most productivity tools ask _what_ you need to do. _My Flow_ asks _who_ you want to be right now. It’s a context‑switching companion that guides your transitions—Work‑You, Personal‑You, Rest‑You—showing only what matters in each moment and turning messy thoughts into focused action. Less clutter, more intention.”

## Future Vision (Beyond MVP)

- Real integrations (Calendar, Email, Slack) for authentic context data.
- Pattern learning that recommends more balanced rhythms across the week.
- Gentle automation (suggested time‑blocks, smart reminders) that respects boundaries.
- Shared contexts for families or teams.

---

# One‑Page Summary (for a hand‑in)

**Problem**: People aren’t short on tasks—they’re short on clarity while constantly switching contexts.
**Solution**: _My Flow_, an AI‑guided, context‑first companion that turns natural conversation into focused flows and helps users transition intentionally.
**Why Now**: Context switching is pervasive; AI makes lightweight guidance possible without heavy setup.
**MVP**: Auth → choose a context → chat to add intentions → see 3–5 items per context → guided transitions.
**Outcome**: Less overwhelm, more presence; a markedly different experience from a traditional to‑do app.
