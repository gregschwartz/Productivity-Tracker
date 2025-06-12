Here’s a functional brief for each module in your updated Productivity Tracker architecture. I’ve treated backend‑centric features via an Admin/Developer Dashboard screen so we can unify all configuration and status UIs.

---

## Task Management

### Daily Task List Screen

#### Default State

* **Layout & Hierarchy**

  * Page header “Today’s Tasks” (xl bold), with date subheading (base regular)
  * Primary “Add Task” button (accent‑filled, pill shape) in top‑right
  * Vertical list of task cards, each with name (md semibold), time‑spent badge (sm caps), focus‑level chip (color accent)
  * Generous white space between cards; alternating subtle background bands for scanability
* **Affordances & Signifiers**

  * Task card hover: slight scale‑up (1.02×) and shadow lift (2px→6px)
  * Completed tasks: checkbox on left, fades to 50% opacity when checked, slides to “Completed” section at bottom
* **Animations & Feedback**

  * On load: cards stagger‑fade in from bottom (150 ms delays)
  * Hover transitions: 200 ms ease‑out
  * Checkbox toggle: spring‑based bounce (stiffness tuned for snappy feel)

#### Adding New Task

* **Inline Form Expansion**

  * Clicking “Add Task” button morphs it into a two‑row form (physics‑based spring expand)
  * Fields:

    1. **Task Name** (text input, placeholder “What did you do?”)
    2. **Time Spent** (hour/minute dropdowns)
    3. **Focus Level** (3 colored radio chips: low/medium/high)
  * Primary CTA “Save” (filled accent) and secondary “Cancel” (text only)
* **Validation & Error Prevention**

  * Empty name: inline tooltip “Please enter a task name” (red, 300 ms fade)
  * Time zero: disable “Save” until valid input
* **Saving State**

  * “Save” button shows spinner replacing label; card placeholder appears in list with pulsing skeleton
* **Post‑Save Success**

  * New card slides down into list, then gently bounces into place
* **Error State**

  * Form shakes horizontally (200 ms), shows toast “Couldn’t save. Check connection.”

#### Editing & Deleting Task

* **Edit Trigger**

  * Clicking task name enters inline edit mode: text becomes input, other fields appear
* **Editing State**

  * Save/Cancel icons fade in at card right; “Save” follows same loading pattern as Add
* **Delete Trigger**

  * Hover reveals trash icon; tapping shows slide‑up confirmation sheet (“Delete this task?”)
* **Delete State**

  * On confirm, card height collapses with smooth ease, then removed

#### Empty State

* **Zero Tasks**

  * Centered illustration (light outline style) and copy “No tasks yet. Ready to get productive?”
  * Single “Add Your First Task” button below

---

## Visualization

### Productivity Dashboard Screen

#### Default State

* **Layout**

  * Header “Your Productivity Trends” (xl bold), subnav toggling “Heatmap” / “Bar Chart” (md semibold, underline on active)
  * Chart container centered, surrounded by ample whitespace
* **Chart Components**

  * **Heatmap**: day/time grid, each cell colored via subtle gradient representing intensity
  * **Bar Chart**: weekly bars, each bar height animated on load (grow from zero)
* **Affordances**

  * Tooltip on hover: soft drop shadow, pointer‑following, showing exact value and date
  * Keyboard accessible: arrow keys move focus between cells/bars, visible focus ring

#### Loading & Error States

* **Loading**: grey skeleton grid or bar shadows shimmer at 1.2 s intervals
* **Error**: central card (“Couldn’t load trends.”) with “Retry” button

#### Empty State

* Encouraging copy “Complete some tasks to see your trends.” plus “Add Task” CTA

---

## Weekly Summary Service

### Weekly Summary Screen

#### Summary Available

* Card list of weekly summaries, each card:

  * Week range (e.g. “May 19–25”) in bold
  * Excerpt of summary text, truncated with “…”
  * Actions: “Read More” link, Copy icon, Delete icon
* **Layout & Hierarchy**

  * Two‑column grid on desktop; single column on mobile (responsive break at 768 px)
  * Cards have generous padding, drop shadow (2px→4px), rounded corners (8px)
* **Animations**

  * Cards fade‑in with 100 ms stagger
  * Hover on card elevates shadow depth

#### Loading State

* Placeholder cards with animated pulse blocks

#### Missing Summary

* If last week’s summary missing, show banner at top:

  > “Weekly summary not yet generated.” \[Generate Now]
* Button triggers immediate summary generation

#### Generation In‑Progress

* Banner button becomes spinner + “Generating…”
* When complete, banner auto‑replaces with success toast (“Summary ready.”)

#### Error State

* Toast “Failed to generate summary. Try again.”
* Banner returns to default

---

## On‑Demand Fallback

*(Tied into Weekly Summary Screen)*

### Fallback Trigger (User‑initiated)

#### No Summary → User Clicks “Generate Now”

* Button disabled, spinner shown
* Underlying Search Agent invoked
* Visual feedback: banner shows progress bar

#### Fallback Success

* Banner slides up “Summary generated!” in green
* Summary card appears at top of list

#### Fallback Failure

* Inline alert “Couldn’t generate summary via fallback.” with “Retry”

---

## Search Agent

### Search Screen

#### Idle State

* Search bar at top: full‑width input, placeholder “Search by keyword (e.g. ‘coding’)”
* Recent searches dropdown on focus (shows last 5 queries)
* Accent underline animates on focus

#### Searching

* On submit, input spinner replaces search icon
* Results container shows shimmer placeholders

#### Results State

* Table of:

  * **Week Range** column
  * **Snippet** column with highlighted keywords
* Table header sticky on scroll; row hover highlight (light accent tint)
* Pagination or infinite scroll with “Load More” spinner

#### No Results

* Centered copy “No matches. Try another term.”
* Suggestion chips “coding” “meetings” “design” for synonyms

#### Error

* Inline banner “Search failed. Check connection.” with “Retry”

---

Each of these briefs applies our principles of **bold simplicity**, **thoughtful whitespace**, **strategic color accents**, **motion choreography**, and **accessibility**—ensuring that every interaction is clear, responsive, and aligned with users’ primary tasks.
