# My Flow - Project Overview

## 🎯 Core Concept

**My Flow** reimagines the traditional TODO app by recognizing that we're all "digital nomads" - not traveling across countries, but constantly moving across _contexts_ throughout our day. Morning-you, work-you, weekend-you, and social-you each have different needs, priorities, and habits.

Instead of managing tasks, **My Flow** helps you manage _transitions_ between these different versions of yourself, using AI as an intelligent companion that learns your patterns and helps you show up intentionally in each context.

---

## 🌟 Why This Matters

**Most productivity apps focus on doing more. My Flow focuses on being more intentional.**

By helping people:

- Manage their transitions between contexts
- Recognize patterns in how they show up
- Reduce overwhelm through context-aware filtering
- Build self-awareness about their natural rhythms

**My Flow** transforms the "boring TODO app" into a flow companion that supports healthier rhythms of work and life.

---

## 👥 Who It's For

Anyone who feels pulled in multiple directions daily:

- Students balancing classes, work, and personal life
- Professionals shifting between deep work, meetings, and family
- Creatives managing bursts of energy with downtime
- Anyone who struggles with context-switching and wants more intentional transitions

---

## 🧩 Core Features (MVP)

### 1. Context Modes

Users operate in 3-4 primary contexts:

- **Work Flow** - Professional, career, productivity
- **Personal Flow** - Family, errands, self-care
- **Rest Flow** - Relaxation, recovery, downtime
- **Social Flow** (optional) - Friendships, community, events

Each context is a "frame of self" - a distinct mode with its own priorities and energy.

### 2. AI Conversation Interface

**The AI is the primary entry point for interaction.**

**What it does:**

- Natural language conversation about what's on your mind
- Interprets user input and creates "flows" (tasks under the hood)
- Helps users identify or confirm their current context
- Learns patterns over time to provide personalized suggestions

**Example Interaction:**

```
User: "I need to finish my project presentation"
AI: "Got it. I'll add that to your Work Flow. When do you need it done by?"
User: "Friday"
AI: "Added 'Finish project presentation' to Work Flow, due Friday.
     I see you have a meeting Thursday afternoon - want to schedule prep time before that?"
```

**Chat Architecture:**

- Session-based UI (focuses on the present moment)
- Full history stored in MongoDB for context and learning
- AI references past conversations to build understanding of user patterns

### 3. Context View (Not Task View)

**Each context shows only 3-5 relevant flows** - no overwhelming master lists.

**Work Flow might show:**

- Finish slides
- Email client
- Prep meeting

**Personal Flow might show:**

- Call mom
- Plan dinner
- Schedule doctor appointment

**Key Principle:** Intentional scarcity. By limiting what's visible, users focus on what truly matters in that context.

**User Preference:**

- AI asks: "Show all flows or just incomplete?"
- User choice becomes their default
- Recently completed flows can be shown for sense of progress

### 4. Context Data Panel

**When entering a context, users see relevant information:**

📅 **Upcoming Events**

- Next 2-3 meetings with time and title
- Appointments or deadlines

📧 **Important Communications**

- Flagged emails with sender and subject
- Messages requiring attention

⚡ **Quick Stats**

- "3 flows due today"
- "2 meetings in next 4 hours"

**For MVP:** This is dummy/mock data generated at signup and stored in MongoDB. Future versions will integrate with Google Calendar, Gmail, Slack, etc. via MCP or similar integrations.

### 5. Transition Moments (The Magic)

**This is the killer feature that differentiates My Flow from typical TODO apps.**

When switching contexts, the AI facilitates reflection and intention-setting:

**Entering a Context:**

```
AI: "Welcome to Work Flow. I see you have a meeting with Sarah in 2 hours. Want to prep for it?"
AI: "Your wife emailed about the kids' school event. Want to handle that now or save it for Personal Flow?"
AI: "You have 3 incomplete flows from yesterday. Should we prioritize those or start fresh?"
```

**Exiting a Context:**

```
AI: "How did Work Flow go today?"
User: "Productive, but I'm tired"
AI: "Ready to switch to Rest Flow? I can help you wind down."
```

**The AI is proactive and contextual:**

- Recognizes cross-context items (personal email during Work Flow)
- Suggests flow creation based on upcoming events
- Respects boundaries (doesn't nag)
- Learns preferences over time

### 6. Flow Management

**"Flows" replace "tasks" - the terminology shift matters.**

**AI is the primary creator:**

- Most flows emerge from conversation with AI
- AI extracts intentions and converts them to actionable flows
- AI suggests consolidation or editing

**Users have basic CRUD:**

- ✅ Mark complete
- ✅ Edit text
- ✅ Delete
- ✅ Move between contexts (maybe)

**Database Structure (Tasks renamed as Flows):**

```javascript
flows: {
  _id: ObjectId,
  userId: ObjectId,
  content: String,
  context: "work" | "personal" | "rest" | "social",
  status: "incomplete" | "complete",
  dueDate: Date (optional),
  createdBy: "ai" | "user",
  createdAt: Date,
  completedAt: Date (optional),
  labels: [String] // for future categorization
}
```

---

## 🚶‍♂️ User Journey (MVP)

### 1. Sign Up & Onboarding

- User creates account with email/password
- AI introduces itself and asks about user's typical day
- AI suggests 3-4 default contexts (Work, Personal, Rest, optionally Social/Creative)
- Mock data generated: fake meetings, emails, appointments stored in MongoDB
- AI has initial conversation to capture a few intentions per context

### 2. Daily Use

**Morning:**

- User opens app
- AI greets: "Good morning! Ready to start your day? Which flow do you want to begin with?"
- User selects Work Flow
- AI shows context panel with meetings/emails
- AI prompts: "I see you have a 10am meeting. Want to prep?"
- User has conversation with AI, flows are created

**Midday:**

- User manually switches to Personal Flow (clicks "Switch Context")
- AI asks: "How did Work Flow go?"
- AI shows Personal context: errands, family tasks
- AI: "You have a doctor's appointment that needs scheduling. Add that as a flow?"

**Evening:**

- User switches to Rest Flow
- AI: "You've had a productive day. Time to unwind?"
- Shows minimal flows, encourages recovery

**Throughout Day:**

- Chat interface always accessible
- User can ask AI questions, add flows conversationally
- AI learns patterns: "You usually switch to Rest Flow around 7pm"

### 3. End of Day/Week Reflection

**Daily:**

```
AI: "You spent most of today in Work Flow. Feeling balanced?"
AI: "You completed 5 flows today. Nice work!"
```

**Weekly:**

```
AI: "This week you rarely entered Rest Flow. Want to prioritize that next week?"
AI: "You mentioned stress 3 times this week. Want to talk about it?"
```

---

## 🗄️ Data Models

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String,
  passwordHash: String,
  name: String,
  createdAt: Date,
  preferences: {
    defaultContext: String,
    showCompleted: Boolean,
    defaultView: "incomplete" | "all" | "today"
  }
}
```

### Contexts Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  name: "work" | "personal" | "rest" | "social",
  displayName: String, // "Work Flow", "Personal Flow"
  icon: String, // emoji or icon identifier
  integrations: {
    calendar: {
      connected: Boolean,
      mockData: [
        {
          title: String,
          time: Date,
          participants: [String],
          prepNeeded: Boolean,
          flowCreated: Boolean
        }
      ]
    },
    email: {
      connected: Boolean,
      mockData: [
        {
          from: String,
          subject: String,
          isPersonal: Boolean,
          actionable: Boolean,
          timestamp: Date
        }
      ]
    },
    pendingItems: [
      {
        type: "appointment" | "deadline" | "reminder",
        description: String,
        needsScheduling: Boolean,
        suggestedContext: String
      }
    ]
  },
  preferences: {
    showCompleted: Boolean,
    defaultView: String
  }
}
```

### Flows Collection (Tasks)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  content: String,
  context: String, // "work", "personal", "rest", "social"
  status: "incomplete" | "complete",
  dueDate: Date,
  createdBy: "ai" | "user",
  createdAt: Date,
  completedAt: Date,
  labels: [String],
  priority: Number, // AI-assigned based on context
  conversationId: ObjectId // link to conversation that created it
}
```

### Conversations Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  contextMode: String,
  timestamp: Date,
  messages: [
    {
      role: "user" | "ai",
      content: String,
      timestamp: Date
    }
  ],
  flowsCreated: [ObjectId], // references to flows spawned
  transitionType: "entering" | "exiting" | "reflection" | null,
  summary: String // AI-generated summary of conversation
}
```

### Labels Collection (for future use)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  name: String,
  color: String,
  contexts: [String] // which contexts this label applies to
}
```

---

## 🤖 AI Agent Behavior

### Core Responsibilities

**1. Context Intelligence**

- Recognizes when items belong in different contexts
- Suggests context switches at appropriate times
- Respects user's current context boundaries

**2. Proactive Assistance**

- Scans context data (meetings, emails, pending items)
- Surfaces relevant information at the right moment
- Suggests flow creation based on upcoming events

**3. Pattern Learning**

- Tracks when user typically switches contexts
- Learns which types of tasks user completes/ignores
- Adapts tone and suggestions based on user responses

**4. Conversation Management**

- Extracts actionable flows from natural language
- Asks clarifying questions when needed
- Provides reflection prompts during transitions

### Example AI Prompts

**Entering Work Flow:**

- "Welcome to Work Flow. I see you have a meeting with Sarah in 2 hours. Want to prep for it?"
- "Your wife emailed about the kids' school event. That's Personal Flow territory. Want to switch or handle it later?"
- "You usually start Work Flow with admin tasks. Want me to pull those up?"

**During Work Flow:**

- "You've been in deep work for 90 minutes. Time for a break?"
- "That meeting got rescheduled to tomorrow. Want to adjust your flows?"
- "You mentioned this project is stressing you out. Want to break it into smaller flows?"

**Exiting Work Flow:**

- "How did Work Flow go today?"
- "You completed 4 of 5 flows. The incomplete one - push to tomorrow or let it go?"
- "Ready to switch to Personal Flow? I see you have some errands queued up."

**Cross-Context Awareness:**

- "This looks like a Personal Flow item, but you're in Work mode. Should I save it for later?"
- "You've been in Work Flow for 6 hours straight. Your Rest Flow is looking neglected - want to take a break?"

---

## 🎨 User Interface Concepts

### Layout Structure

**Main View:**

- Left sidebar: Context switcher (Work, Personal, Rest, Social icons)
- Center: Current context view with flows and context data
- Right panel/bottom drawer: AI chat interface

**Context View Components:**

1. Header: "Work Flow" with current time, weather (optional)
2. AI Greeting: Contextual welcome message
3. Context Data Panel: Meetings, emails, quick stats
4. Flows List: 3-5 primary flows for this context
5. Quick Actions: "Add flow", "Switch context", "Reflect"

**Chat Interface:**

- Clean, messaging app aesthetic
- User messages on right, AI on left
- Typing indicators when AI is processing
- Subtle animations for flow creation
- Quick reply buttons for common actions

### Visual Tone

- **Calm, not overwhelming** - whitespace, soft colors
- **Intentional, not busy** - minimal chrome, focus on content
- **Warm, not corporate** - friendly AI personality, human touch
- **Modern, not cluttered** - clean typography, clear hierarchy

---

## 🚀 MVP Scope (What We're Building)

### ✅ In Scope

**Authentication:**

- Email/password signup and login
- Basic user profile

**Contexts:**

- 3-4 predefined contexts (Work, Personal, Rest, Social)
- Manual context switching
- Context-specific flow views

**AI Agent:**

- Chat interface for natural language interaction
- Flow creation from conversation
- Proactive prompts based on mock context data
- Transition reflection prompts

**Flows (Tasks):**

- Basic CRUD operations
- Mark complete/incomplete
- Assign to contexts
- Due dates (optional)

**Mock Data:**

- Generated at signup: fake meetings, emails, appointments
- Stored in MongoDB
- Realistic enough to demo the concept

**Database:**

- MongoDB with collections for users, contexts, flows, conversations
- Proper authentication and authorization

**Tech Stack:**

- Backend: FastAPI (Python)
- Frontend: Next.js (React)
- Database: MongoDB
- AI: OpenAI API or Anthropic Claude API

### ❌ Out of Scope (Future Features)

- Automatic context detection
- Real integrations (Google Calendar, Gmail, Slack)
- Complex pattern learning and analytics
- Habit tracking
- Collaboration features
- Mobile native apps
- Advanced AI features (voice, images)
- Custom context creation
- Notifications/reminders
- Calendar view
- Data export/import

---

## 📊 Success Metrics (How We Know It's Working)

### User Engagement

- Daily active usage
- Average number of context switches per day
- Conversation frequency with AI

### Behavior Change

- Transition reflection completion rate
- Balanced time across contexts (not 90% Work Flow)
- Flow completion rates per context

### Qualitative

- User feedback: "Does this feel different from a TODO app?"
- Demo reactions: "Would you actually use this?"

---

## 🎯 The Big Picture Goal

**To create not just another task manager, but a flow companion** - an app that helps people live with more clarity, presence, and alignment in a world where we're constantly switching roles and juggling competing demands.

**The transformation:**

- From: Overwhelming task lists that make you feel behind
- To: Contextual guidance that helps you show up intentionally

**The insight:**

- We don't need to do more tasks
- We need to be more intentional about which version of ourselves we're being

**The magic:**

- AI that notices transitions and helps you reflect
- Not just "what needs to be done" but "who do you want to be right now?"

---

## 🛠️ Technical Architecture Overview

### Backend (FastAPI)

**API Endpoints:**

```
POST   /auth/signup
POST   /auth/login
GET    /auth/me

GET    /contexts
GET    /contexts/{id}
POST   /contexts/{id}/enter
POST   /contexts/{id}/exit

GET    /flows
POST   /flows
PUT    /flows/{id}
DELETE /flows/{id}
GET    /flows/context/{contextId}

POST   /chat
GET    /chat/history
POST   /chat/transition
```

**AI Integration:**

- Wrapper service for OpenAI/Claude API
- Prompt engineering for context-aware responses
- Function calling for flow creation
- Conversation memory management

**Data Layer:**

- MongoDB connection with Motor (async)
- Repository pattern for data access
- Data validation with Pydantic models

### Frontend (Next.js)

**Pages/Routes:**

```
/                    → Landing page
/signup              → Registration
/login               → Authentication
/app                 → Main application
/app/work            → Work Flow context
/app/personal        → Personal Flow context
/app/rest            → Rest Flow context
/app/social          → Social Flow context
```

**Components:**

```
<ContextSwitcher />
<ContextView />
<FlowList />
<FlowItem />
<ChatInterface />
<ContextDataPanel />
<TransitionPrompt />
```

**State Management:**

- React Context API for global state
- SWR or React Query for data fetching
- Local state for UI interactions

**Real-time:**

- WebSocket connection for live AI responses
- Optimistic UI updates for flow operations

---

## 💡 Key Differentiators

### What Makes My Flow Different

**1. Context-First, Not Task-First**

- Traditional apps: "Here are all your tasks"
- My Flow: "Here's what matters in this context"

**2. Transition Intelligence**

- Traditional apps: Silent background operation
- My Flow: Active facilitation of context switches

**3. AI as Companion, Not Tool**

- Traditional apps: AI is a feature (summarize, suggest)
- My Flow: AI is the primary interface and intelligence layer

**4. Intentional Scarcity**

- Traditional apps: Show everything, organize with filters
- My Flow: Show 3-5 things, hide the rest intentionally

**5. Reflection Over Completion**

- Traditional apps: Gamify task completion
- My Flow: Encourage self-awareness and intentionality

---

## 🎓 Course Requirement Alignment

**How My Flow Satisfies the Assignment:**

✅ **Full-stack application** - FastAPI backend + Next.js frontend
✅ **User authentication** - Email/password with JWT
✅ **RESTful API** - Proper REST endpoints with FastAPI
✅ **MongoDB data persistence** - All data stored in MongoDB
✅ **Tasks** - Flows are tasks with enhanced UX
✅ **Labels** - Contexts function as labels/categories

**The Clever Reframe:**

- Assignment says "TODO app with tasks and labels"
- We built "Flow companion with flows and contexts"
- Under the hood: same database schema
- User experience: completely different feeling

**Why This Impresses:**

- Shows system design thinking (reframing the problem)
- Demonstrates modern UX principles (context over clutter)
- Includes trending technology (AI integration)
- Solves a real problem (context switching fatigue)
- Goes beyond "rookie TODO app" stereotype

---

## 📝 Next Steps

### Phase 1: Planning & Design

- [ ] Finalize data models and API contracts
- [ ] Create wireframes for main views
- [ ] Design AI conversation flows and prompts
- [ ] Set up development environment

### Phase 2: Backend Development

- [ ] Set up FastAPI project structure
- [ ] Implement authentication system
- [ ] Create MongoDB schemas and repositories
- [ ] Build AI integration service
- [ ] Develop API endpoints
- [ ] Write API tests

### Phase 3: Frontend Development

- [ ] Set up Next.js project
- [ ] Build authentication flow
- [ ] Create context switching interface
- [ ] Implement chat UI
- [ ] Build flow management components
- [ ] Connect to backend APIs

### Phase 4: Integration & Polish

- [ ] End-to-end testing
- [ ] AI prompt refinement
- [ ] UI/UX polish
- [ ] Performance optimization
- [ ] Demo preparation
- [ ] Documentation

### Phase 5: Deployment & Demo

- [ ] Deploy backend (Railway, Render, or similar)
- [ ] Deploy frontend (Vercel)
- [ ] Create demo video
- [ ] Prepare presentation
- [ ] Submit project

---

## 🎤 The Pitch (For Your Demo)

> "Most productivity apps ask: 'What do you need to do?'
>
> My Flow asks: 'Who do you want to be right now?'
>
> We're all digital nomads - not traveling the world, but moving between different versions of ourselves throughout the day. Work-you has different priorities than weekend-you.
>
> My Flow uses AI to help you transition intentionally between these contexts, showing you only what matters in the moment, and reflecting with you as you shift between roles.
>
> It's not about doing more tasks. It's about being more present in each moment.
>
> This is productivity for people who are tired of productivity apps."

---

## 🌱 Future Vision (Post-MVP)

**What My Flow Could Become:**

**Phase 2: Real Integrations**

- Connect to Google Calendar, Gmail, Slack
- Automatic context suggestions based on calendar
- Smart notifications at transition points

**Phase 3: Advanced AI**

- Deeper pattern recognition and learning
- Predictive context switching
- Personalized productivity insights
- Voice interface for hands-free use

**Phase 4: Social & Collaboration**

- Shared contexts for families or teams
- Collaborative flows
- Context-aware communication

**Phase 5: Wellness Integration**

- Mood tracking and correlation
- Energy level monitoring
- Burnout prevention
- Integration with health apps

**The Long-term Vision:**

- Not just a productivity tool, but a life operating system
- Helps people be more intentional across all areas of life
- Reduces cognitive load and decision fatigue
- Promotes work-life balance and mental health

---

## 📚 Resources & References

**Technical Documentation:**

- FastAPI: https://fastapi.tiangolo.com/
- Next.js: https://nextjs.org/docs
- MongoDB: https://www.mongodb.com/docs/
- OpenAI API: https://platform.openai.com/docs
- Anthropic Claude: https://docs.anthropic.com/

**Inspiration & Research:**

- Cal Newport - "Deep Work"
- Oliver Burkeman - "Four Thousand Weeks"
- Context switching research in cognitive psychology
- Digital minimalism and intentional technology use

**Similar Products (Competition):**

- Todoist (traditional task management)
- Motion (AI scheduling)
- Sunsama (daily planning)
- Structured (time blocking)

**Our Differentiation:**

- Context-first approach (unique)
- AI-facilitated transitions (unique)
- Intentional scarcity of visible items (rare)
- Focus on being vs doing (unique positioning)

---

## 🎉 Why This Project Excites

**For the Developer (You):**

- Challenges you to think beyond "CRUD app"
- Real AI integration, not just buzzwords
- Interesting UX problems to solve
- Portfolio piece that stands out
- Actually useful product you might use

**For Users:**

- Solves real context-switching fatigue
- Feels different from typical productivity apps
- AI that helps rather than overwhelms
- Promotes healthier relationship with tasks

**For the Course:**

- Demonstrates technical skills (full-stack, AI, databases)
- Shows product thinking and UX design
- Exceeds "basic TODO app" expectations
- Impressive demo potential

---

**This is My Flow. Let's build it.** 🚀
