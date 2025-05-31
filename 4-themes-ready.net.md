Here’s a functional brief for each module in your updated Productivity Tracker architecture, styled to emulate Ready.net.

---

## Task Management

### Daily Task List Screen

#### Default State

*   **Layout & Hierarchy**
    *   Page header “Today’s Tasks” (xl bold, similar sans-serif font as Ready.net, dark grey/black), with date subheading (base regular, lighter grey).
    *   Primary “Add Task” button (Ready.net’s vibrant purple, pill shape, white text/icon) in top‑right.
    *   Vertical list of task cards. Cards have a light grey background, thin darker grey border, and minimal shadow.
        *   Task name (md semibold, dark grey/black).
        *   Time‑spent badge (sm caps, medium grey background, white text).
        *   Focus‑level chip (using shades of Ready.net’s blue/purple: e.g., dark blue for high, medium purple for medium, light blue/grey for low).
    *   Moderate white space between cards.
*   **Affordances & Signifiers**
    *   Task card hover: border color darkens slightly.
    *   Completed tasks: checkbox on left. When checked, task card content becomes greyed out (50% opacity), and an optional strikethrough on the task name.
*   **Animations & Feedback**
    *   On load: cards fade in subtly (200ms).
    *   Hover transitions: 100ms ease-out.
    *   Checkbox toggle: simple, quick state change.

#### Adding New Task

*   **Slide-in Panel or Modal**
    *   Clicking “Add Task” button slides in a panel from the right or opens a modal with a light background and a subtle border, similar to Ready.net's UI elements.
    *   Fields:
        1.  **Task Name** (text input, placeholder “Enter task details”, clean sans-serif, grey border on focus).
        2.  **Time Spent** (dropdowns or simple input fields for hours/minutes).
        3.  **Focus Level** (segmented control or radio buttons using the Ready.net blue/purple palette).
    *   Primary CTA “Save Task” (Ready.net purple) and secondary “Cancel” (text button, dark grey).
*   **Validation & Error Prevention**
    *   Empty name: inline error message below the field (muted red text).
    *   Time zero: “Save Task” button disabled.
*   **Saving State**
    *   “Save Task” button shows a small, circular loading spinner (white on purple button).
*   **Post‑Save Success**
    *   Panel/Modal closes; new task card appears in the list with a quick highlight or subtle animation.
    *   Toast notification (top-right, Ready.net style: light background, thin border, purple accent for success).
*   **Error State**
    *   Panel/Modal shows an error message at the top (muted red text).

#### Editing & Deleting Task

*   **Edit Trigger**
    *   Edit icon (simple pencil, dark grey) appears on task card hover.
    *   Clicking icon opens the same Add Task panel/modal, pre-filled.
*   **Editing State**
    *   “Save Task” updates to “Update Task.” Behavior is consistent with adding.
*   **Delete Trigger**
    *   Delete icon (simple trash can, dark grey) on hover.
    *   Confirmation pop-up with a design similar to other Ready.net modals/alerts: “Delete this task?” with “Delete” (purple or dark grey button) and “Cancel” (text button).
*   **Delete State**
    *   On confirm, card is removed from the list with a fade-out animation.

#### Empty State

*   **Zero Tasks**
    *   Centered text: “No tasks logged for today.” (dark grey, clean sans-serif).
    *   “Add Task” button below, styled consistently.

---

## Storage Layer (Offline Resilience)

### Global Network Status Component

#### Online State

*   No explicit visual indicator by default, or a very discreet icon (e.g., small grey dot) in the app footer or header.

#### Offline State

*   A subtle banner appears at the top or bottom of the screen (light grey background, dark grey text):
    > “Offline mode. Your data is being saved locally and will sync upon reconnection.”
    *   Dismiss “×” button.
*   **Offline Task Operations**
    *   Functionality remains. A small, unobtrusive icon (e.g., a disconnected plug) might appear on cards saved offline.
*   **Reconnection Sync**
    *   Banner updates: “Reconnecting & Syncing...” (perhaps with a subtle pulsing dot or line).
    *   On completion: Banner changes to “Sync complete.” (purple accent or text) and auto-dismisses.

---

## Visualization

### Productivity Dashboard Screen

#### Default State

*   **Layout**
    *   Header “Productivity Trends” (xl bold, dark grey), subnav for chart types (Heatmap/Bar Chart) using underlined text or subtle tabs, similar to Ready.net navigation.
    *   Charts are clean, with a focus on data clarity, using the Ready.net color palette (blues, purples, greys) for data series.
*   **Chart Components**
    *   **Heatmap**: Day/time grid, cells colored with gradients of blue/purple.
    *   **Bar Chart**: Weekly bars using shades of purple and blue. Animations on load are subtle, if any.
*   **Affordances**
    *   Tooltips on hover: clean, rectangular tooltips with a light background and dark text.
    *   Interactive elements have clear focus states (e.g., darker border or background).

#### Loading & Error States

*   **Loading**: Simple text “Loading chart data...” or a subtle, non-intrusive spinner.
*   **Error**: Centered text message “Unable to load productivity trends.” with a “Retry” link (purple text).

#### Empty State

*   Text: “Track your tasks to visualize your productivity trends here.”
*   Link/button to “Add Task”.

---

## Weekly Summary Service

### Weekly Summary Screen

#### Summary Available

*   List of summaries, potentially in cards or a more tabular/list format if Ready.net leans that way for dense info.
*   If cards: light grey background, thin border, minimal shadow.
    *   Week range (bold, dark grey).
    *   Summary excerpt.
    *   Actions: “View Full Summary” link (purple text), Copy icon (dark grey).
*   **Layout & Hierarchy**
    *   Clean layout, possibly with filters or sorting options (e.g., by date) at the top.
    *   Responsive design adjusting for screen size.
*   **Animations**
    *   Minimal animations, focus on fast loading and responsiveness.

#### Loading State

*   Text “Loading summaries...” or skeleton loaders that mimic the card/list item structure.

#### Missing Summary

*   Banner at the top (light grey background):
    > “The summary for the most recent week is not yet available.” Button: “[Generate Now]” (purple).
*   A primary button, perhaps labeled "Generate Current Week's Report" (styled with Ready.net purple), should be persistently available on this screen if the current week's summary is missing.

#### Generation In‑Progress

*   Button becomes disabled with a spinner: “Generating...”. This action will trigger a backend call to `https://ai.pydantic.dev/`.

#### Error State

*   Toast notification (Ready.net style) for failure: “Summary generation failed.”
*   Banner may update with an error message and a “Retry” option.

---

## Search Agent

### Search Screen

#### Idle State

*   Search bar: input field with a grey border, search icon. Placeholder “Search weekly summaries...”.
*   Possibly a list of recent searches or suggested queries below, styled modestly.

#### Searching

*   A small loading spinner appears next to or inside the search bar.

#### Results State

*   Results displayed in a list format:
    *   Week Range.
    *   Snippet with highlighted keywords (highlight color: a lighter shade of Ready.net purple or blue).
*   Pagination controls if many results.

#### No Results

*   Centered text: “No results found for your search term.”
*   Option to refine search or clear.

#### Error

*   Inline message below search bar: “Search failed. Please try again.”

---

## Admin / Developer Dashboard

*(Styled to look like a professional, data-centric interface, akin to Ready.net's platform feel)*

### Integrations & Config Screen

#### API Keys & Rate Limits

*   **Default**: Forms with input fields having light grey borders, clear labels. Sections for different services.
*   **Save**: CTA “Save Configuration” (purple button).
*   **Success/Error**: Toast notifications (top-right, light background, purple/red accent for success/error).

#### Connection Tests

*   Buttons “Test Connection” (secondary style, e.g., dark grey with white text, or white with purple border/text).
*   Status text appears next to button: “Connected” (greenish/purple text) or “Failed” (reddish text).

#### CI/CD Status

*   Section with text: “Last GitHub Actions Run: [Status Badge] - [Timestamp].” Link to logs.
*   Badges use Ready.net-compatible colors (e.g., green for success, red for fail, blue for in-progress).

#### Hosting & Infra Health

*   Dashboard using cards or a list view for services (Frontend, Backend, Chroma).
*   Status indicators (dots or text: e.g., “Operational” in a muted green/blue, “Error” in a muted red).

#### Alerts & Monitoring

*   List of active alerts with severity, message, and timestamp.
*   Clean, tabular layout.

---

## Summary & Vector Storage (Admin Dashboard Section)

### Data Management Screen

#### Embedding Store Health

*   Simple progress bar (using Ready.net blue/purple) for vector store usage.
*   “Reindex Store” button (secondary style).

#### Summary Store Overview

*   Key metrics displayed as text (e.g., “Total Summaries: 120”).
*   Controls for purging old summaries (e.g., dropdown for retention period, “Apply” button).

---

This design brief aims to capture the **professional, clean, and data-oriented aesthetic of Ready.net**, utilizing its color palette (primarily purples, blues, and greys), typography choices, and preference for clear, structured layouts with minimal, purposeful animation. 