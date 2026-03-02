# ShiftBoard -- Employee Shift Availability App

## Overview

ShiftBoard is a web app that lets a shift manager (admin) view and manage employee availability, and lets employees submit their weekly shift preferences. It replaces a manual Google Forms + Spreadsheet workflow.

---

## Tech Stack

- **Frontend:** React (Vite), TanStack Router, Tailwind CSS
- **Backend/DB/Auth:** Supabase (PostgreSQL + Google OAuth + Row Level Security)
- **Email:** Resend (transactional emails)
- **Deployment:** Vercel

---

## Database Schema (Supabase / PostgreSQL)

### `users`

| Column     | Type      | Notes                                      |
|------------|-----------|--------------------------------------------|
| id         | uuid      | PK, default `gen_random_uuid()`            |
| email      | text      | Unique, not null. Set by admin.            |
| name       | text      | Display name. Set on first login or by admin. |
| is_admin   | boolean   | Default `false`                            |
| auth_id    | uuid      | FK to `auth.users.id`, nullable. Populated on first successful login. |
| created_at | timestamptz | Default `now()`                          |

### `shifts`

| Column     | Type      | Notes                                      |
|------------|-----------|--------------------------------------------|
| id         | uuid      | PK, default `gen_random_uuid()`            |
| user_id    | uuid      | FK to `users.id`, not null                 |
| date       | date      | Not null                                   |
| type       | text      | `'full'` or `'half'`. Check constraint.    |
| created_at | timestamptz | Default `now()`                          |
| updated_at | timestamptz | Default `now()`                          |

**Constraints:**
- Unique constraint on `(user_id, date)` -- one shift record per user per day.
- Check constraint: `type IN ('full', 'half')`.
- No record means "no shift" for that day.

---

## Authentication & Authorization

### Flow

1. Admin seeds their own email into `users` with `is_admin = true`.
2. Admin adds employee emails to `users` table (via admin UI). These rows have `auth_id = null` until the employee logs in.
3. Employee visits the app and clicks "Sign in with Google".
4. On successful Google OAuth, the app checks if the authenticated email exists in `users`:
   - **Yes:** Link `auth.users.id` to the `users.auth_id` column. Proceed to app.
   - **No:** Show an error: "Your account has not been authorized. Contact your manager."
5. All subsequent requests use Supabase RLS policies tied to `auth.uid()`.

### Row Level Security Policies

- **users table:**
  - Employees can read their own row.
  - Admins can read/insert/update/delete all rows.
- **shifts table:**
  - Employees can read all shifts (needed for calendar display).
  - Employees can insert/update/delete their OWN shifts, subject to the cutoff rule (enforced in app logic or via RLS/database function).
  - Admins can insert/update/delete ANY shifts with no restrictions.

---

## Business Rules

### Week Definition
- A "week" runs Monday to Sunday.
- The week boundary / cutoff is **Monday 00:00 (midnight)** in the app's timezone.

### Shift Editing Cutoff
- Employees can only create/edit/delete shifts for **next week and beyond**.
- Once Monday 00:00 arrives, that week becomes read-only for employees.
- In concrete terms: if today is any day in week N, employees can edit week N+1, N+2, etc., but NOT week N or earlier.
- **Admins are exempt from the cutoff.** They can edit any shift at any time.

### Shift Types
- Each day can have at most one shift: either `full` or `half`.
- Toggling between full and half replaces the existing record.
- Removing a shift deletes the record.

---

## Pages & Routing (TanStack Router)

### `/` -- Employee View (authenticated)

A weekly calendar where the logged-in employee manages their own shifts.

**Layout (see screenshot references):**
- 7 columns: M, T, W, T, F, S, S
- Navigation arrows to go to previous/next week.
- A header showing the current week number (e.g., "week 10").
- Each day cell is tappable/clickable. Tapping cycles through: no shift -> full shift -> half shift -> no shift. Or use a small selector.
- Full shifts are displayed as a tall pink/salmon block. Half shifts as a shorter yellow block.
- The y-axis shows reference times (10:30, 13:30, 17:30) for visual context only -- these are NOT stored or editable.
- Days in past/current week are visually dimmed and non-interactive.
- A "Submit" or "Save" button persists changes.
- On save, send an email receipt via Resend.

### `/admin` -- Admin View (authenticated, `is_admin = true`)

A calendar overview showing ALL employees' shifts.

**Layout (see screenshot references):**
- A multi-week grid. Each row is a week (e.g., "week 8", "week 9", ...).
- 7 columns: M, T, W, T, F, S, S.
- Each cell shows small colored name tags for each employee who has a shift that day:
  - Red/Rose tag = full shift
  - Yellow/Amber tag = half shift
  - Name inside the tag (e.g., "Adam", "Ed", "John").
- Clicking on a cell or a tag should allow the admin to add/edit/remove shifts for that day. (Exact interaction TBD -- for now, a modal or inline dropdown is fine. Can be refined later.)
- The admin should be able to scroll/navigate through weeks.

### `/admin/users` -- User Management (authenticated, `is_admin = true`)

- List of all users with name, email, admin status.
- Form to add a new user by email.
- Ability to remove users.
- Ability to promote/demote admin status.

### Auth pages

- `/login` -- Google sign-in button. Redirect to `/` on success, show error if email not in `users` table.
- Unauthenticated users are redirected to `/login`.
- Non-admin users trying to access `/admin/*` are redirected to `/`.

---

## Email (Resend)

### On shift submission/update:

Send an email to the employee with:
- Subject: "Your shift schedule has been updated"
- Body: A summary of their submitted shifts for the affected week(s).
  - Format: a simple list like:
    ```
    Week of March 9, 2026:
      Monday: Full shift
      Wednesday: Half shift
      Thursday: Full shift
    ```
- If this is an edit (not first submission), include a diff showing what changed:
    ```
    Changes:
      Wednesday: No shift -> Half shift
      Friday: Full shift -> (removed)
    ```

The email sending should be triggered from the frontend via a Supabase Edge Function (or a small serverless function on Vercel) that calls the Resend API. Do not put the Resend API key in the frontend.

---

## Environment Variables

```
VITE_SUPABASE_URL=<supabase project url>
VITE_SUPABASE_ANON_KEY=<supabase anon key>
RESEND_API_KEY=<resend api key>  # only in edge function / server-side
```

---

## Project Structure (suggested)

```
shiftboard/
  src/
    main.tsx
    App.tsx
    routes/
      index.tsx          # Employee view
      login.tsx
      admin/
        index.tsx        # Admin calendar view
        users.tsx        # User management
    components/
      WeekCalendar.tsx   # Shared weekly grid component
      ShiftCell.tsx      # Individual day cell
      ShiftTag.tsx       # Colored name tag for admin view
      WeekNav.tsx        # Week navigation arrows
    lib/
      supabase.ts        # Supabase client init
      auth.tsx           # Auth context/provider
      shifts.ts          # Shift CRUD helpers
      dates.ts           # Week calculation, cutoff logic
    types/
      index.ts           # Shared types (User, Shift, ShiftType, etc.)
  supabase/
    migrations/          # SQL migrations for tables, RLS policies
    functions/
      send-email/        # Edge function for Resend
  public/
  index.html
  vite.config.ts
  tailwind.config.ts
  package.json
  tsconfig.json
```
