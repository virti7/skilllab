# CRM Integration Plan — SkillLab

## Overview
Integrate the CRM module as SkillLab's admissions layer. Currently the CRM works independently — leads exist in isolation with no connection to actual student accounts. This plan connects the full pipeline: **Lead → Follow-up → Interest → Convert to Student → Assign to Batch → Student Portal**.

---

## Step 1: Backend — Enhance `getDashboard` with Real Platform Stats

**File:** `D:\skilllab\backend\src\controllers\crm.controller.js` — `getDashboard` function (lines 24-76)

**What changes:**
- Add 3 new platform-level stats: `totalStudents` (actual users with role=STUDENT), `totalInstitutes`, `totalUsers`
- Existing stats (totalLeads, newLeads, enrolledLeads, followUpsToday, conversionRate, recentLeads, statusChart) stay as-is
- Add `monthlyLeads`: array of last 6 months with `{ month, count }` — group leads by `createdAt` month via raw SQL
- Add `followUpStatusChart`: group follow-ups by status → `{ status, count }[]`
- Institute scoping: ADMIN scoped to their instituteId; SUPER_ADMIN platform-wide
- Platform stats (totalStudents, totalInstitutes, totalUsers) always platform-wide

**Response shape (merged with existing):**
```json
{
  "totalLeads": 42, "newLeads": 8, "enrolledLeads": 5,
  "followUpsToday": 3, "conversionRate": 12,
  "totalStudents": 120, "totalInstitutes": 5, "totalUsers": 135,
  "recentLeads": [...], "statusChart": [...],
  "monthlyLeads": [{"month": "Jan", "count": 5}, ...],
  "followUpStatusChart": [{"status": "PENDING", "count": 3}, ...]
}
```

---

## Step 2: Backend — Create `convertLead` Endpoint

**File:** `D:\skilllab\backend\src\controllers\crm.controller.js` — new function

**New endpoint:** `POST /api/crm/leads/:id/convert`

**Request body:** `{ batchId?: string, password?: string }`

**Logic (transactional):**
1. Find lead by id — 404 if not found, 400 if already ENROLLED
2. Check no existing user with lead.email — 409 if duplicate
3. Generate random password if not provided (`crypto.randomBytes(12).toString('hex')`)
4. Hash with `bcrypt.hash(password, 12)`
5. In `$transaction`: find/create Institute → create User (STUDENT) → update Lead (ENROLLED) → optionally create BatchStudent if batchId provided
6. Return: `{ user, lead, batchId?, generatedPassword }`

**Route:** `router.post('/leads/:id/convert', convertLead);` in `crm.routes.js`

---

## Step 3: Backend — Hook CRM Sync Into Batch Join

**File:** `D:\skilllab\backend\src\controllers\batch.controller.js` — `joinBatch` (line 85)

After `batchStudent.create`, add (wrapped in try/catch, non-blocking):
- Find Lead with matching email where status NOT IN ['ENROLLED', 'REJECTED']
- If found, update lead status to 'ENROLLED'

---

## Step 4: Frontend API — Add New Types and Methods

**File:** `D:\skilllab\frontend\src\lib\api.ts`

- Update `CrmDashboardData`: add `totalStudents`, `totalInstitutes`, `totalUsers`, `monthlyLeads`, `followUpStatusChart`
- Add `ConvertLeadResponse` interface
- Add `crmApi.convertLead(leadId, { batchId?, password? })` method

---

## Step 5: Frontend — Rewrite `CrmDashboard.tsx`

**File:** `D:\skilllab\frontend\src\pages\admin\CrmDashboard.tsx`

- 8 stat cards: 5 CRM pipeline + 3 platform overview (2 rows)
- Monthly Leads Trend BarChart (left) + Follow-up Status PieChart (right)
- Empty states: "No leads yet" with Add Lead button when totalLeads=0
- Chart empty states: "No data available" text when data is empty

---

## Step 6: Frontend — Rewrite `CrmLeadDetails.tsx`

**File:** `D:\skilllab\frontend\src\pages\admin\CrmLeadDetails.tsx`

- Replace "Mark as Enrolled" with "Convert to Student" button
- Convert Dialog: batch selector dropdown (optional), password field (optional, generates random if empty)
- Post-conversion: success card with generated password + copy button
- Load batches via `batchApi.getAdminBatches()` on mount

---

## Step 7: Verification Checklist

| Scenario | Expected Result |
|----------|-----------------|
| Dashboard with no leads | "No leads yet" empty state, stats = 0 |
| Create lead | totalLeads increments, monthlyLeads updates |
| Schedule follow-up | followUpsToday increments |
| Convert lead without batch | Creates student, lead → ENROLLED, password shown |
| Convert lead with batch | Creates student + BatchStudent |
| Convert with existing email | 409 error |
| Student joins via invite code | Matching CRM lead auto-updates to ENROLLED |
| Dashboard real student count | totalStudents = actual STUDENT users |
| Charts refresh | Navigate away/back → data is current |

---

## Files Modified

| File | Change |
|------|--------|
| `backend/src/controllers/crm.controller.js` | Enhanced getDashboard + new convertLead |
| `backend/src/routes/crm.routes.js` | Add POST /leads/:id/convert |
| `backend/src/controllers/batch.controller.js` | CRM sync hook in joinBatch |
| `frontend/src/lib/api.ts` | Updated types + convertLead method |
| `frontend/src/pages/admin/CrmDashboard.tsx` | 8 stat cards, new charts, empty states |
| `frontend/src/pages/admin/CrmLeadDetails.tsx` | Convert to Student dialog + batch selector |
