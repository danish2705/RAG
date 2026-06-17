Update the existing QMS application UI and behavior to align with real-world GxP deviation and change control workflows, while maintaining the current visual design and layout.

⚠️ DO NOT redesign UI layout, spacing, or styling.
Only modify:
- Workflow logic
- Field behavior
- Data binding
- Labels and structure
- AI integration points

---

🏷️ 1. APPLICATION NAME

Rename application globally:

❌ Remove:
"QMS Pro" / "Quality Events Manager"

✅ Use:
"Deviation & Change Control"

Apply consistently across:
- Sidebar
- Header
- Page titles

---

🔁 2. SINGLE INTAKE FLOW (CRITICAL)

❌ REMOVE completely:
- Separate "Deviation Management"
- Separate "Change Control" entry points
- Any manual workflow selection

✅ REPLACE WITH:
👉 Single menu item: "Quality Event Intake"

---

🧠 3. AI-DRIVEN WORKFLOW DECISION

User should ONLY enter data in the FIRST screen.

After submission:

System MUST:
- Classify event (GxP Deviation / Planned Departure / Change Control)
- Decide:
  - requires_change_control
  - redirect_to
- Populate ALL downstream screens

---

📌 4. WORKFLOW CORRECTION (VERY IMPORTANT - CLIENT FEEDBACK)

Fix incorrect sequence:

❌ Current (WRONG):
AI → Impact → Change Control → RCA → CAPA

✅ Correct flow:

1. Event Intake (User Input)
2. AI Initial Assessment
   - Classification
   - Severity
   - Immediate actions suggestion
3. Immediate Correction (IMPORTANT)
   - Show what needs to be fixed NOW
   - This happens BEFORE deep analysis
4. Detailed Impact Assessment
5. Historical Analysis
6. Root Cause Analysis
7. CAPA (Corrective + Preventive Actions)
   - Change Control decision happens HERE (not earlier)
8. Effectiveness Check (AI-driven)
9. Close Deviation

---

🚨 5. CHANGE CONTROL LOGIC FIX (CRITICAL)

❌ REMOVE:
Change Control decision from early screens

✅ MOVE TO:
CAPA / Corrective Action section

Logic:
- Change Control is triggered ONLY when:
  → corrective action requires system/process change

UI Behavior:
- Show inline indicator in CAPA:
  "This action requires Change Control"
- Provide CTA:
  "Create Change Control Record"

❌ DO NOT create separate flow early

---

🧩 6. ROOT CAUSE & CAPA (AUTO-POPULATED)

All fields MUST be pre-filled using AI response JSON.

Fields:
- Root Cause
- Correction (immediate fix)
- Corrective Actions
- Preventive Actions

UI:

Replace empty inputs with:
✅ Pre-filled editable fields

Add label:
👉 "AI Suggested – Please review and edit if required"

---

🔁 7. REMOVE MANUAL DATA ENTRY AFTER FIRST SCREEN

❌ No empty fields in any screen after intake

All pages must:
- Be auto-populated
- Allow editing (optional)
- Never block user

---

⚡ 8. IMMEDIATE ACTION VS CORRECTION (IMPORTANT FIX)

Clarify distinction:

- Immediate Action → what user already did
- Correction → what system suggests to fix issue

Both should be visible separately.

---

📊 9. IMPACT ASSESSMENT (FIX TIMING)

❌ Current issue:
Too early and too final

✅ Fix:
- First: show initial impact (light)
- Later: detailed impact assessment (editable)

---

📚 10. HISTORICAL ANALYSIS

Keep as-is, but:

Add:
- Clear indication:
  "This helps identify recurrence, not decision-making"

---

🧠 11. CONFIDENCE SCORE (FIX LOGIC)

❌ DO NOT:
Use raw LLM confidence

✅ DO:
Display confidence based on:
- Weighted business rules (configurable)

Add tooltip:
"Confidence is calculated based on predefined business rules and data completeness"

---

📌 12. EXPLAINABILITY (MANDATORY)

For every AI output:

Show:
- Rationale (expandable)
- Why decision was made

---

🔄 13. EFFECTIVENESS CHECK (AI-DRIVEN)

❌ REMOVE:
Manual inputs

✅ Replace with:
Auto-filled read-only section

Logic:
- High severity → show
- Low / planned departure → hide

Optional:
"Edit if required"

---

📎 14. ACTION TRACKING (TRACEABILITY)

Add linkage:

Deviation → Actions → Change Control

UI must:
- Show action owner
- Show due dates
- Show link to related records

---

📊 15. REPORTS PAGE

Update behavior:

Add:
Search bar (Deviation ID / Change Control ID)

After search, show ONLY:

- Root Cause Analysis Report
- CAPA Effectiveness Report
- Pending Changes Report
- Change Impact Analysis
- Custom Build Report

❌ Remove all other reports

---

📊 16. DASHBOARD SIMPLIFICATION

Keep simple:

- KPI cards only
- Add 1-line description under each KPI

❌ No charts

---

🤖 17. HYBRID CHAT + FORM (IMPORTANT)

Add optional AI chat panel:

Behavior:
- User can type description in chat
- AI asks follow-up questions
- Fields auto-fill dynamically

UI:
- Chat on right side (optional)
- Form on left (structured view)

---

🚫 18. HARD RULES

- NO auto-approval anywhere
- ALWAYS require human confirmation
- ALWAYS allow override with justification
- NEVER lock user into AI decision

---

🎯 FINAL EXPECTATION

System should:

✅ Have single entry point  
✅ Use AI to drive workflow  
✅ Show correct QMS sequence  
✅ Avoid premature decisions  
✅ Auto-fill everything after intake  
✅ Maintain full human control  
✅ Be explainable and auditable  

---

Ensure all changes are implemented using reusable components and existing layout without redesign.