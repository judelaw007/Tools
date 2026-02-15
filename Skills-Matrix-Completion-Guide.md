# Skills Matrix Completion Guide

**For the admin configuring a newly created tool's skills integration.**

---

## What This Document Covers

A developer has built a tool and registered it in the platform. It exists in the database, it's allocated to a course, and users can access it. But the tool does not yet appear in anyone's Skills Portfolio.

This document walks you through completing the Skills Matrix configuration so that the tool contributes to learner portfolios — and explains the decisions you need to make along the way.

---

## How the Skills Matrix Works (The 30-Second Version)

The Skills Matrix organises learner achievements into **Skill Categories**. Each category has two halves:

| Half | Source | What It Proves | Colour on Portfolio |
|---|---|---|---|
| **Knowledge** | Completing a LearnWorlds course | The learner understands the theory | Purple |
| **Application** | Saving projects using a tool | The learner can apply the theory | Blue |

A skill category only appears on a learner's portfolio after they complete **at least one linked course**. Tools appear within a category only after the learner **completes at least one workflow** (saves a project) with that tool.

This means the Skills Matrix is a portfolio of actual achievements — not a checklist of what's available.

---

## Before You Start

Confirm these prerequisites with the developer:

| Prerequisite | How to Check | Why It Matters |
|---|---|---|
| Tool exists in the database | `/admin/tools` — tool appears in the list | Can't link what doesn't exist |
| Tool status is "Live" (active) | `/admin/tools` — status badge shows "Live" | Inactive tools don't appear in the skill category tool dropdown |
| Tool is allocated to at least one course | `/admin/courses` — course shows the tool in its allocations | Users can't access unallocated tools, so they can't earn skills from them |
| Tool tracking is wired | Ask the developer: "Does the tool call `onTrackCompletion`?" | Without this callback, `workflow_complete` events never fire, so project counts never increment, and the tool never appears in Application |

If any of these are missing, stop here and resolve them first. The skills configuration will appear to work in the admin panel but will produce no results for users.

---

## Step-by-Step Configuration

### Step 1: Decide — New Category or Existing?

Go to `/admin/skills`. You'll see all existing skill categories as expandable cards.

**Ask yourself:** Does this tool belong to a subject area that already has a category?

| Situation | Action |
|---|---|
| A category already exists for this domain (e.g., "Pillar 2 Skills" for a new Pillar Two tool) | Use the existing category — skip to Step 3 |
| This tool opens a new domain (e.g., first Transfer Pricing tool) | Create a new category — proceed to Step 2 |
| The tool spans multiple domains | Pick the primary domain, or create a "Cross-Category" skill category |

**Guiding principle:** Skill categories map to subject areas, not to individual tools. A "Pillar 2 Skills" category might contain three courses and four tools. Don't create a category per tool.

---

### Step 2: Create a New Skill Category (If Needed)

Click **"Add Skill Category"** in the top-right corner. A modal opens with four fields:

| Field | Required | What to Enter | Example |
|---|---|---|---|
| **Category Name** | Yes | The subject area name. Learners see this as the heading on their portfolio. | `Pillar 2 Skills` |
| **Slug** | Yes | Auto-generated from the name. URL-safe identifier. You can edit it but rarely need to. | `pillar-2-skills` |
| **Knowledge Description** | No | Legacy field. Not used in the current portfolio design. You can leave it blank or use it as an internal note. | *(leave blank)* |
| **Display Order** | No | Controls sort order on the learner's portfolio. Lower numbers appear first. Default is 0. | `1` |

Click **Create**. The new category card appears and auto-expands so you can start configuring it.

---

### Step 3: Link Courses (Knowledge Half)

Inside the expanded category card, find the **"Linked Courses (trigger Knowledge)"** section. This section has a purple theme.

**For each course that should contribute knowledge to this category:**

1. Select a course from the **"+ Add course..."** dropdown at the bottom. Only LearnWorlds courses appear here.
2. The course appears as a purple box. Fill in two fields:

| Field | What It Is | Where the Learner Sees It | Example |
|---|---|---|---|
| **Learning Hours** | Estimated hours of study this course represents. Numeric, supports half-hours (e.g., 2.5). | Displayed as a badge on the portfolio next to the course. Totalled by year in a "Learning Hours" summary card. Useful for CPD/CPE tracking. | `2.5` |
| **Knowledge Description** | A sentence describing what completing this course proves. Written in second person ("You have...") or third person ("Has demonstrated..."). | Displayed in the purple Knowledge box on the learner's portfolio, directly under the course name. Also appears on the QR-verified printout. | `Has demonstrated understanding of GloBE mechanics, transitional safe harbour rules, and the Pillar Two minimum tax framework.` |

**Repeat** for every course that teaches the subject matter of this category.

**Important considerations:**

- A course can belong to **multiple** skill categories if it covers multiple subjects.
- The Knowledge Description should describe **what the learner now knows**, not what the course contains. "Has demonstrated understanding of..." rather than "This course covers...".
- Learning Hours affect the learner's annual CPD total — set them thoughtfully, matching the actual study time expected.

---

### Step 4: Link the Tool (Application Half)

In the same expanded category card, find the **"Linked Tools (trigger Application)"** section. This section has a grey theme.

1. Select your new tool from the **"+ Add tool..."** dropdown. Only active tools appear.
2. The tool appears as a grey box. Fill in one field:

| Field | What It Is | Where the Learner Sees It | Example |
|---|---|---|---|
| **Application Description** | A sentence describing what using this tool demonstrates. Written in second person or third person. | Displayed in the blue Application box on the learner's portfolio, directly under the tool name. Also appears on the QR-verified printout. | `Can perform GloBE ETR calculations, apply substance-based income exclusions, and determine top-up tax liability across jurisdictions.` |

**Repeat** for every tool that practises the subject matter of this category.

**Important considerations:**

- A tool can belong to **multiple** skill categories if it practises skills across domains.
- The Application Description should describe **what the learner can do**, not what the tool does. "Can perform..." rather than "This tool calculates...".
- The Application section only appears on the learner's portfolio if they have **saved at least one project** with the tool. Merely opening the tool or running a calculation is not enough — they must complete a full workflow (which triggers the `workflow_complete` tracking event).

---

### Step 5: Save Changes

Click the green **"Save Changes (N)"** button in the top-right corner. The number in parentheses shows how many unsaved edits exist.

All pending changes (descriptions, learning hours, new links) are saved in one batch. A "Saved!" confirmation appears briefly.

If you navigate away without saving, a warning banner reminds you: *"You have N unsaved changes."* You can also click **Discard** to revert to the saved state.

---

## What the Learner Sees (End Result)

After you complete the configuration, here's what happens from the learner's perspective:

### Before Completing a Course
The skill category does **not appear** on their portfolio at all. They don't see an empty category — they see nothing. The portfolio only shows actual achievements.

### After Completing a Linked Course
The skill category appears on their portfolio with:
- **Category name** as the heading (e.g., "Pillar 2 Skills")
- **Knowledge section** (purple) showing:
  - Course name with a green "Completed" or "Score: 85%" badge
  - Learning hours badge (e.g., "2.5 hrs")
  - Your Knowledge Description text
  - Completion date
- If they haven't used any linked tools yet, the Application section is absent

### After Completing Workflows with a Linked Tool
The **Application section** (blue) appears within the same category, showing:
- Tool name
- Project count badge (e.g., "3 projects")
- Your Application Description text
- Last used date

### On the Printed / PDF Portfolio
Everything above is rendered in a print-friendly layout with:
- The learner's name
- A QR code that links to a public verification page
- All selected skill categories with their Knowledge and Application sections
- Descriptions, scores, dates, hours, and project counts

---

## Writing Good Descriptions

The descriptions you write are the most important part of this configuration. They appear on every learner's portfolio and on every QR-verified printout. They are the words an employer or colleague reads when evaluating someone's competence.

### Knowledge Descriptions (Per Course)

These answer: **"What does this person now understand?"**

| Approach | Example |
|---|---|
| Describe the competence gained | "Has demonstrated understanding of GloBE income calculations, adjusted covered taxes, and the 15% minimum ETR threshold." |
| Reference the regulatory framework | "Understands the OECD Pillar Two GloBE Rules as they apply to in-scope MNE groups with consolidated revenue above EUR 750 million." |
| Highlight practical understanding | "Can explain the relationship between CbCR data, GloBE income, and jurisdictional ETR determinations." |

**Avoid:**
- Describing the course content ("This course covers...") — describe the learner, not the course
- Being too generic ("Understands Pillar Two") — be specific about what they understand
- Being too long — one to two sentences is ideal

### Application Descriptions (Per Tool)

These answer: **"What can this person now do?"**

| Approach | Example |
|---|---|
| Describe the practical skill | "Can perform three-stage GloBE calculations including ETR determination, SBIE exclusion, and top-up tax computation." |
| Reference professional context | "Able to assess whether a jurisdiction qualifies for transitional CbCR safe harbour treatment using de minimis, simplified ETR, and routine profits tests." |
| Highlight workflow competence | "Can complete a GIR Practice Form across all three sections, including entity structure definition and jurisdiction-level calculations." |

**Avoid:**
- Describing the tool ("This calculator performs...") — describe the learner, not the tool
- Overstating what the demo proves ("Is qualified to file GIR returns") — keep it educational
- Being too vague ("Has used the calculator") — be specific about what they've practised

---

## What Triggers Each Half

Understanding the triggers helps you verify the configuration is working.

### Knowledge Trigger: Course Completion

```
LearnWorlds marks course as complete
  → Learner clicks "Sync Progress" on portfolio (or it syncs automatically)
    → Platform calls LearnWorlds API for latest enrollment data
      → Finds course completion → matches to skill category via course link
        → Category appears on portfolio with course details
```

**Key detail:** The progress score (e.g., 85%) comes directly from LearnWorlds. The platform does not assess the learner — it reads their LearnWorlds completion status.

### Application Trigger: Workflow Completion

```
Learner finishes a full tool workflow and the tool fires onTrackCompletion()
  → Tracking event sent to POST /api/tools/track with event: 'workflow_complete'
    → API calls incrementToolProjectCount(userEmail, toolId)
      → user_tool_projects.project_count incremented by 1
        → Tool appears in Application section with updated count
```

**Key detail:** "Workflow completion" is defined by each tool. For a multi-step calculator, it's typically completing the final step. For a checklist, it might be reaching a certain completion percentage. The developer defines when `onTrackCompletion` fires.

**What does NOT trigger Application:**
- Viewing the tool page
- Entering data without completing the workflow
- Saving work mid-workflow (saving inputs is different from completing a workflow)

---

## Common Mistakes

| Mistake | What Happens | Fix |
|---|---|---|
| Tool not linked to any skill category | Tool works fine but never appears on any portfolio. Learners can use it, but get no skill credit. | Link it in `/admin/skills`. |
| Course not linked to the category | Category never appears on the learner's portfolio (categories require at least one completed linked course to show). | Add the course in the Knowledge section. |
| Tool is linked but `onTrackCompletion` isn't wired | Project count stays at 0 forever. Tool never appears in Application section. | Developer must wire the tracking callback. |
| Knowledge Description left blank | Course appears on portfolio but with no description — just the name, score, and date. Looks incomplete. | Write a description. |
| Application Description left blank | Tool appears on portfolio but with no description — just the name and project count. | Write a description. |
| Learning Hours set to 0 or left blank | No hours badge appears for this course. Annual hours total may look lower than expected. | Set appropriate hours. |
| Created a category but forgot to save | Changes appear locally but aren't persisted. Refreshing the page loses them. The amber warning banner reminds you. | Click "Save Changes". |
| Same tool in multiple categories without distinct descriptions | Both categories show identical text for the tool, which looks copy-pasted. | Write context-specific descriptions for each category. |

---

## Verifying Your Configuration

After completing the steps above, verify with this checklist:

### In the Admin Panel
- [ ] Go to `/admin/skills` — your skill category exists and shows the correct course count and tool count
- [ ] Expand the category — courses have descriptions and learning hours filled in
- [ ] Expand the category — tools have application descriptions filled in
- [ ] No amber "unsaved changes" banner is showing

### Using Student View
- [ ] Go to the admin sidebar → Student View → select "Account + [the relevant course]"
- [ ] Navigate to `/dashboard/skills`
- [ ] Click "Sync Progress" — the skill category should appear (if the simulated student has course completion data)
- [ ] The Knowledge section shows the course with your description, score, and hours
- [ ] Exit Student View when done

### With a Real Test User
- [ ] User completes the linked course in LearnWorlds
- [ ] User visits `/dashboard/skills` and clicks "Sync Progress"
- [ ] Skill category appears with Knowledge section populated
- [ ] User opens the tool and completes a full workflow
- [ ] User refreshes the portfolio — Application section appears with project count = 1
- [ ] User clicks "Print / PDF" — the printout includes the category with both halves
- [ ] QR code on the printout links to a working verification page

---

## Quick Reference: Admin Panel Location

| Action | Where |
|---|---|
| Create skill category | `/admin/skills` → "Add Skill Category" button |
| Link course to category | `/admin/skills` → expand category → Knowledge section → "+ Add course..." |
| Write knowledge description | `/admin/skills` → expand category → Knowledge section → textarea under course name |
| Set learning hours | `/admin/skills` → expand category → Knowledge section → numeric input next to clock icon |
| Link tool to category | `/admin/skills` → expand category → Application section → "+ Add tool..." |
| Write application description | `/admin/skills` → expand category → Application section → textarea under tool name |
| Remove a course or tool | `/admin/skills` → expand category → X button on the course/tool box |
| Save all changes | Green "Save Changes (N)" button in top-right corner |
| Check tool is active | `/admin/tools` → find tool → status should be "Live" |
| Check tool is allocated | `/admin/courses` → find course → "Allocate Tools" → tool should be ticked |

---

## The Relationship Between the Three Admin Pages

Completing the Skills Matrix touches three separate admin pages. Here's how they relate:

```
/admin/tools                    /admin/courses                /admin/skills
─────────────                   ──────────────                ─────────────
Tool exists?  ──────────────►   Tool allocated to course? ──► Tool linked to skill category?
Status = Live?                  Course has the tool ticked?   Description written?

If NO at any step:              If NO:                        If NO:
Tool is invisible               Users can't access the tool   Tool works but earns no
to everyone                     even if they're enrolled      portfolio credit
```

All three must be configured for the full experience. The developer handles `/admin/tools` (creating the tool record). You handle `/admin/courses` (allocating) and `/admin/skills` (skill mapping).

---

*Document version: 1.0*
*Date: February 2026*
