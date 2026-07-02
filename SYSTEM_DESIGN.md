# System Design Write-Up — Society Maintenance Tracker

## Overview

The platform is a three-tier web application: a React SPA for the frontend, an Express REST API for the backend, and SQLite (swappable for PostgreSQL) as the database. Role-based JWT authentication separates resident and admin capabilities. The core design challenge was building a complaint lifecycle that is both tamper-resistant and fully auditable.

---

## 1. Complaint History Model

The complaint history is modelled as an **append-only audit log** in the `ComplaintHistory` table rather than by mutating a `status` field. Every change — creation, status transition, priority change, or overdue flag — produces an immutable row with:

- `complaintId` and `actorId` (who did what to which complaint)
- `fromStatus` / `toStatus` and `fromPriority` / `toPriority` (before/after state for each dimension)
- `action` enum to classify the event type
- `note` (optional admin-facing message that also travels to the resident via email)
- `createdAt` (auto-set by the ORM; never updated)

This design means the history is **never edited or deleted**. The current state of a complaint is always derivable from the latest row, but the full trail — who changed what, when, and why — is always available. Fetching complaints with their history is a single JOIN query (`include: [{ model: ComplaintHistory, as: 'history' }]`), keeping the API response self-contained.

The `Complaint` table still carries denormalized `status` and `priority` columns for fast filtering. These are updated on every change, but they are purely a cache of what the history already records.

---

## 2. Overdue Detection

Overdue detection is **on-demand** rather than event-driven. The admin triggers `POST /complaints/flag-overdue`, which runs a query for all complaints where:

```
status IN ('Open', 'In Progress')
AND isOverdue = false
AND createdAt <= NOW() - OVERDUE_THRESHOLD_DAYS
```

The threshold is read from `OVERDUE_THRESHOLD_DAYS` in the environment, defaulting to 7 days. Every complaint that matches is flipped to `isOverdue = true` and a `flagged_overdue` history entry is created so the audit trail captures when and by whom it was flagged.

Overdue complaints bubble to the top of the admin list via `ORDER BY isOverdue DESC`. An `isOverdue=true` query param enables the admin to filter to only overdue items.

This pull model was chosen over a background cron job to keep the deployment simple and dependency-free. A production upgrade path would be to swap it for a scheduled job (node-cron or a cloud scheduler) that calls the same logic automatically every morning.

---

## 3. Photo Handling

Photos are optional on complaints and handled with **Multer** middleware. The pipeline:

1. The frontend POSTs `multipart/form-data` to `POST /complaints`
2. Multer validates the MIME type (jpeg, png, gif, webp) and enforces a 5 MB file size limit
3. The file is stored to `backend/uploads/` with a collision-safe timestamp + random suffix filename
4. The stored relative path (`/uploads/<filename>`) is saved to `Complaint.photoPath`
5. The backend serves the `uploads/` directory as static files at the same path

In production on a platform like Render, the uploads directory does not survive deployments. The recommended upgrade is to pipe the Multer `MemoryStorage` stream directly to an S3-compatible bucket (AWS S3, Cloudflare R2) and store the public URL instead of a file path — a one-line change to the controller.

---

## 4. Notification Flow

Two email events are supported:

**a) Complaint status change** — Triggered in `PATCH /complaints/:id/status` after the database write succeeds. The controller fetches the resident via the complaint's `residentId`, then calls `sendComplaintStatusUpdate(resident, complaint, newStatus, note)`. The email includes the complaint ID, title, new status, and any note the admin added.

**b) Important notice** — Triggered in `POST /notices` when `isImportant: true`. The controller fetches all users with `role = 'resident'` and calls `sendImportantNotice(residents, notice)`, which sends a single email to all resident addresses in one SMTP call.

The email service uses **Nodemailer** with a Gmail SMTP transport. If the credentials are absent, the service falls back to a console-log mock so development works without any email config. Errors in email delivery are caught and logged but do not fail the HTTP response — the database write is already committed, so the update should not be rolled back due to a mail service outage.

---

## Key Trade-offs

| Decision | Chosen | Alternative |
|---|---|---|
| Database | SQLite | PostgreSQL |
| ORM | Sequelize | Prisma |
| History model | Append-only log | Versioned rows |
| Overdue detection | On-demand API | Scheduled cron |
| File storage | Local disk | S3 / R2 |
| Email | Nodemailer / Gmail | SendGrid, Resend |

The current choices minimise setup friction and third-party dependencies for evaluation. Each has a clear upgrade path for production without changing the overall architecture.
