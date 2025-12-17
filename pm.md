# 📄 Product Requirements Document (PRD)

## Product Name

**Admissions Story Generator (v1)**
Internal marketing automation tool for YouTube admissions content

---

## 1. Problem Statement

Creating high-quality admissions marketing content is slow and mentally exhausting because it requires:

* deciding *what* to talk about,
* framing it as a compelling story,
* writing hooks, scripts, and captions consistently,
* avoiding risky or misleading claims.

Existing tools are generic and do not understand **college admissions context**, policies, or tone requirements.

---

## 2. Product Goal

Enable the founder to generate **high-performing, admissions-specific YouTube stories** in minutes instead of hours.

The product must:

* reduce content ideation friction,
* enforce brand and compliance guardrails,
* produce structured outputs suitable for YouTube and Shorts.

---

## 3. Target User

**Primary user (v1):**

* Founder / marketer
* Managing own YouTube channel(s)
* Education / admissions niche

No client access required in v1.

---

## 4. Non-Goals (Explicit)

* ❌ Social media scheduling
* ❌ Client billing or permissions
* ❌ Fully automated publishing
* ❌ Multi-platform analytics

These are out of scope for v1.

---

## 5. Core User Flow

```
Open Story Studio
→ Select inputs (audience, story type, tone, length)
→ Generate hooks + script
→ Edit/refine output
→ Save draft
→ Copy/export for recording & upload
```

---

## 6. Features & Requirements

### 6.1 Authentication (Simple)

* User can sign in
* Single default workspace (“My Channel”)

**Acceptance Criteria**

* User can log in and see their workspace
* All generated content is scoped to that workspace

---

### 6.2 Story Studio (Primary Feature)

#### Inputs

* Audience: Student | Parent
* Platform: YouTube Long | Shorts
* Length: 30s | 60s | 3–5min
* Story Type:

  * Policy confusion
  * Myth-busting
  * Deadline horror story
  * Essay mistake
  * Parent reassurance
  * Product demo
* Tone: Calm | Urgent | Authoritative | Friendly
* Topic (free text)
* Optional source text or URL
* CTA style: Soft | Direct | None

#### Outputs

* 5 hooks
* Full script (sectioned)
* On-screen captions
* 10 title options
* Description template (with disclaimer)

**Acceptance Criteria**

* User can generate content with one click
* Output is editable in the UI
* Output follows structured sections
* No prohibited claims appear

---

### 6.3 Regenerate Section

* User can regenerate:

  * hooks only
  * script only
  * titles only
  * captions only

**Acceptance Criteria**

* Regeneration does not overwrite untouched sections
* User can regenerate multiple times

---

### 6.4 Library

* View saved story drafts
* Filter by status: Draft | Published | Archived
* Search by topic
* Duplicate existing story

**Acceptance Criteria**

* Saved stories persist
* Duplicating creates a new editable copy

---

### 6.5 Brand Guidelines

User-defined rules:

* Tone notes
* Banned claims (“guaranteed admission”)
* Default disclaimer
* Default links block

**Acceptance Criteria**

* Guidelines are injected into generation prompts
* Violations are avoided in outputs

---

### 6.6 Export

* Copy full script
* Export as:

  * Plain text
  * Markdown

**Acceptance Criteria**

* Exported text preserves structure
* Disclaimers included automatically

---

## 7. AI Behavior Requirements

* Output must be **structured JSON**
* No hallucinated facts
* Encourage verification when policies are referenced
* Simple, spoken-language style
* Hooks optimized for attention, not clickbait

---

## 8. Data Model (Summary)

Core entities:

* User
* Workspace
* BrandGuidelines
* StoryProject
* Feedback (optional)

(Full schema provided below in repo structure.)

---

## 9. Success Metrics (Internal)

* Time to generate first usable script < 2 minutes
* % of generated stories saved > 60%
* Manual edits required decreasing over time
* Consistent posting cadence enabled

---

## 10. Risks & Mitigations

| Risk            | Mitigation                    |
| --------------- | ----------------------------- |
| Generic content | Admissions-specific templates |
| Risky claims    | Banned phrases + system rules |
| Over-automation | User approval required        |
| Content fatigue | Story types + regeneration    |

---

# 🗂 Repo Structure (React + Express + MongoDB)

This is a **monorepo** structure that scales cleanly.

```
admissions-story-generator/
│
├── client/                     # React frontend
│   ├── public/
│   └── src/
│       ├── app/
│       │   ├── App.tsx
│       │   ├── routes.tsx
│       │   └── store.ts
│       │
│       ├── features/
│       │   ├── auth/
│       │   ├── storyStudio/
│       │   │   ├── StoryStudio.tsx
│       │   │   ├── StoryInputs.tsx
│       │   │   ├── StoryOutputs.tsx
│       │   │   ├── HookPicker.tsx
│       │   │   └── RegenerateButton.tsx
│       │   │
│       │   ├── library/
│       │   │   ├── Library.tsx
│       │   │   └── StoryCard.tsx
│       │   │
│       │   └── brand/
│       │       └── BrandGuidelines.tsx
│       │
│       ├── services/
│       │   └── api.ts
│       │
│       ├── types/
│       │   └── story.ts
│       │
│       └── utils/
│           └── export.ts
│
├── server/                     # Node + Express backend
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   └── db.ts
│   │   │
│   │   ├── routes/
│   │   │   └── story.routes.ts
│   │   │
│   │   ├── controllers/
│   │   │   └── story.controller.ts
│   │   │
│   │   ├── services/
│   │   │   ├── storyGenerator.service.ts
│   │   │   ├── regenerate.service.ts
│   │   │   └── promptBuilder.service.ts
│   │   │
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Workspace.ts
│   │   │   ├── BrandGuidelines.ts
│   │   │   └── StoryProject.ts
│   │   │
│   │   ├── llm/
│   │   │   ├── client.ts
│   │   │   └── schemas.ts
│   │   │
│   │   └── utils/
│   │       └── validation.ts
│
├── shared/
│   └── prompts/
│       ├── storyGenerator.md
│       └── regenerateSection.md
│
├── .env.example
├── package.json
└── README.md
```

---

## Key Architectural Notes

* **Structured JSON output** enforced in `/llm/schemas.ts`
* Prompt versions stored and tracked
* Brand rules injected via `promptBuilder.service.ts`
* Regeneration endpoints reuse saved context
* Easy to add:

  * Shorts repurposer
  * Analytics feedback
  * Client workspaces later
