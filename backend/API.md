# Maintaina (Society Maintenance Tracker — API Documentation)

**Base URL:** `http://localhost:5002/api`  
**Environment:** Development (Port configurable via `PORT` env var, defaults to 5002)

---

## Authentication

All endpoints except `/auth/register` and `/auth/login` require a Bearer token in the `Authorization` header.

```
Authorization: Bearer <token>
```

Tokens are JWT signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN` (default: 7 days).

### Roles

- **resident**: Can create complaints, view own complaints, view all notices
- **admin**: Can view all complaints, update statuses/priorities, flag overdue, manage notices, create users

---

## Endpoints

### Auth

#### `POST /auth/register`

Create a new resident account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123",
  "flatNumber": "12A",
  "phone": "9876543210"
}
```

**Required:** `name`, `email`, `password`  
**Optional:** `flatNumber`, `phone`

**Response (201):**

```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "resident",
    "flatNumber": "12A",
    "phone": "9876543210",
    "createdAt": "2026-07-03T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:**

- `400` — Missing required fields
- `409` — Email already registered

---

#### `POST /auth/login`

Log in with email and password.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "secure123"
}
```

**Response (200):**

```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "resident",
    "flatNumber": "12A",
    "phone": "9876543210",
    "createdAt": "2026-07-03T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:**

- `400` — Missing email or password
- `401` — Invalid credentials

---

#### `GET /auth/profile`

Get the current authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "resident",
    "flatNumber": "12A",
    "phone": "9876543210",
    "createdAt": "2026-07-03T10:00:00Z"
  }
}
```

**Errors:**

- `401` — Unauthorized (missing or invalid token)
- `404` — User not found

---

### Complaints

#### `POST /complaints`

Create a new complaint (resident only). Supports optional photo upload.

**Headers:**

- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data` (if uploading photo)

**Form Data:**

- `title` (string, required): Brief title
- `description` (string, required): Detailed description
- `category` (string, required): Category (e.g., "Maintenance", "Noise", "Parking")
- `photo` (file, optional): Image file (jpeg, png, gif, webp; max 5 MB)

**Response (201):**

```json
{
  "id": 5,
  "residentId": 1,
  "title": "Broken tap in common area",
  "description": "The tap in the main hall is leaking water",
  "category": "Maintenance",
  "photoPath": "/uploads/1688121600000-123456789.jpg",
  "status": "Open",
  "priority": "Low",
  "isOverdue": false,
  "createdAt": "2026-07-03T10:00:00Z"
}
```

**Errors:**

- `400` — Missing required fields
- `401` — Unauthorized
- `400` — Invalid file format or file too large (>5 MB)
- `403` — Only residents can create complaints

---

#### `GET /complaints/my`

Get all complaints submitted by the current resident.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
[
  {
    "id": 5,
    "residentId": 1,
    "title": "Broken tap in common area",
    "description": "The tap in the main hall is leaking water",
    "category": "Maintenance",
    "photoPath": "/uploads/1688121600000-123456789.jpg",
    "status": "Open",
    "priority": "Low",
    "isOverdue": false,
    "createdAt": "2026-07-03T10:00:00Z",
    "history": [
      {
        "id": 1,
        "complaintId": 5,
        "actorId": 1,
        "action": "created",
        "toStatus": "Open",
        "note": "Complaint submitted",
        "createdAt": "2026-07-03T10:00:00Z",
        "actor": {
          "id": 1,
          "name": "John Doe",
          "role": "resident"
        }
      }
    ]
  }
]
```

**Errors:**

- `401` — Unauthorized

---

#### `GET /complaints`

Get all complaints (admin only). Supports filtering and pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `category` (string): Filter by category
- `status` (string): Filter by status (Open, In Progress, Resolved, Closed)
- `priority` (string): Filter by priority (Low, Medium, High)
- `isOverdue` (boolean): Filter overdue complaints (`true` or `false`)
- `from` (ISO date): Filter complaints created on or after this date
- `to` (ISO date): Filter complaints created on or before this date
- `page` (integer): Page number (default: 1)
- `limit` (integer): Results per page (default: 20)

**Example:** `/complaints?status=Open&isOverdue=true&page=1&limit=10`

**Response (200):**

```json
{
  "total": 15,
  "page": 1,
  "pages": 2,
  "complaints": [
    {
      "id": 5,
      "residentId": 1,
      "title": "Broken tap in common area",
      "description": "The tap in the main hall is leaking water",
      "category": "Maintenance",
      "photoPath": "/uploads/1688121600000-123456789.jpg",
      "status": "Open",
      "priority": "High",
      "isOverdue": true,
      "createdAt": "2026-07-03T10:00:00Z",
      "resident": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "flatNumber": "12A"
      },
      "history": [
        {
          "id": 1,
          "complaintId": 5,
          "actorId": 2,
          "action": "status_changed",
          "fromStatus": "Open",
          "toStatus": "In Progress",
          "note": "Assigned to maintenance team",
          "createdAt": "2026-07-03T11:00:00Z",
          "actor": {
            "id": 2,
            "name": "Admin",
            "role": "admin"
          }
        }
      ]
    }
  ]
}
```

**Errors:**

- `401` — Unauthorized
- `403` — Admin access required

---

#### `GET /complaints/dashboard`

Get admin dashboard statistics.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "totalComplaints": 45,
  "openComplaints": 12,
  "inProgressComplaints": 8,
  "resolvedComplaints": 20,
  "overdueComplaints": 5,
  "highPriorityComplaints": 3
}
```

**Errors:**

- `401` — Unauthorized
- `403` — Admin access required

---

#### `PATCH /complaints/:id/status`

Update complaint status (admin only). Triggers email notification to resident.

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**

- `id` (integer): Complaint ID

**Request Body:**

```json
{
  "status": "In Progress",
  "note": "Assigned to maintenance team. Will be fixed by Friday."
}
```

**Valid Statuses:** `Open`, `In Progress`, `Resolved`  
**Note:** Setting status to `Resolved` automatically sets it to `Closed` and records `resolvedAt` timestamp.

**Response (200):**

```json
{
  "id": 5,
  "residentId": 1,
  "title": "Broken tap in common area",
  "description": "The tap in the main hall is leaking water",
  "category": "Maintenance",
  "photoPath": "/uploads/1688121600000-123456789.jpg",
  "status": "Closed",
  "priority": "High",
  "isOverdue": false,
  "resolvedAt": "2026-07-03T11:30:00Z",
  "closedAt": "2026-07-03T11:30:00Z",
  "createdAt": "2026-07-03T10:00:00Z"
}
```

**Errors:**

- `400` — Invalid status
- `400` — Cannot update closed complaints
- `401` — Unauthorized
- `403` — Admin access required
- `404` — Complaint not found

---

#### `PATCH /complaints/:id/priority`

Update complaint priority (admin only).

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**

- `id` (integer): Complaint ID

**Request Body:**

```json
{
  "priority": "High",
  "note": "This is urgent and affects multiple residents"
}
```

**Valid Priorities:** `Low`, `Medium`, `High`

**Response (200):**

```json
{
  "id": 5,
  "residentId": 1,
  "title": "Broken tap in common area",
  "status": "Open",
  "priority": "High",
  "isOverdue": false,
  "createdAt": "2026-07-03T10:00:00Z"
}
```

**Errors:**

- `400` — Invalid priority
- `401` — Unauthorized
- `403` — Admin access required
- `404` — Complaint not found

---

#### `POST /complaints/flag-overdue`

Flag all complaints exceeding the overdue threshold (admin only).

**Headers:** `Authorization: Bearer <token>`

**Threshold Configuration:** Controlled by `OVERDUE_THRESHOLD_DAYS` env var (default: 7 days).

**Response (200):**

```json
{
  "message": "Overdue complaints flagged successfully",
  "flaggedCount": 3
}
```

**Behavior:**

- Finds all complaints with status `Open` or `In Progress` where `isOverdue = false` and `createdAt <= NOW() - OVERDUE_THRESHOLD_DAYS`
- Sets `isOverdue = true` for each match
- Creates a `flagged_overdue` history entry for each flagged complaint

**Errors:**

- `401` — Unauthorized
- `403` — Admin access required

---

### Notices

#### `GET /notices`

Get all notices (public to all authenticated users).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
[
  {
    "id": 2,
    "adminId": 3,
    "title": "Scheduled maintenance: Water supply",
    "content": "Please note that water supply will be cut off on July 5th from 9 AM to 12 PM for maintenance.",
    "isImportant": true,
    "createdAt": "2026-07-03T09:00:00Z",
    "admin": {
      "id": 3,
      "name": "Admin"
    }
  },
  {
    "id": 1,
    "adminId": 3,
    "title": "New parking rules",
    "content": "Parking slots are now numbered. Please park only in your assigned slot.",
    "isImportant": false,
    "createdAt": "2026-07-02T15:30:00Z",
    "admin": {
      "id": 3,
      "name": "Admin"
    }
  }
]
```

**Ordering:** Important notices appear first, followed by creation date (newest first).

**Errors:**

- `401` — Unauthorized

---

#### `POST /notices`

Create a new notice (admin only). If `isImportant: true`, sends an email to all residents.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "title": "Scheduled maintenance: Water supply",
  "content": "Please note that water supply will be cut off on July 5th from 9 AM to 12 PM for maintenance.",
  "isImportant": true
}
```

**Required:** `title`, `content`  
**Optional:** `isImportant` (default: false)

**Response (201):**

```json
{
  "id": 2,
  "adminId": 3,
  "title": "Scheduled maintenance: Water supply",
  "content": "Please note that water supply will be cut off on July 5th from 9 AM to 12 PM for maintenance.",
  "isImportant": true,
  "createdAt": "2026-07-03T09:00:00Z",
  "admin": {
    "id": 3,
    "name": "Admin"
  }
}
```

**Email Sent:** If `isImportant: true`, an email is sent to all residents with the notice details.

**Errors:**

- `400` — Missing title or content
- `401` — Unauthorized
- `403` — Admin access required

---

#### `DELETE /notices/:id`

Delete a notice (admin only).

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**

- `id` (integer): Notice ID

**Response (200):**

```json
{
  "message": "Notice deleted"
}
```

**Errors:**

- `401` — Unauthorized
- `403` — Admin access required
- `404` — Notice not found

---

## File Uploads

### Photo Storage

Complaint photos are stored in `backend/uploads/` and served via `GET /uploads/<filename>`.

**Allowed Formats:** jpeg, jpg, png, gif, webp  
**Max Size:** 5 MB  
**Naming:** `<timestamp>-<random>.ext` (collision-safe)

**Example URL:** `http://localhost:5002/uploads/1688121600000-123456789.jpg`

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Human-readable error message"
}
```

**Common HTTP Status Codes:**

- `200` — OK
- `201` — Created
- `400` — Bad Request (validation error)
- `401` — Unauthorized (missing or invalid token)
- `403` — Forbidden (insufficient permissions)
- `404` — Not Found
- `409` — Conflict (e.g., email already registered)
- `500` — Internal Server Error

---

## Email Notifications

### Triggered Events

**1. Complaint Status Update**

- Trigger: Admin updates complaint status via `PATCH /complaints/:id/status`
- Recipient: Complaint resident
- Subject: `Complaint #<id> Status Update: <status>`
- Includes: Complaint title, new status, category, and admin note (if provided)

**2. Important Notice**

- Trigger: Admin creates notice with `isImportant: true` via `POST /notices`
- Recipients: All residents
- Subject: Notice title
- Includes: Full notice content

### Email Service

**Provider:** Nodemailer with Gmail SMTP (configurable)  
**Fallback:** Ethereal (test email service) if no credentials provided  
**Configuration:**

- `EMAIL_HOST` — SMTP host (default: smtp.gmail.com)
- `EMAIL_PORT` — SMTP port (default: 587)
- `EMAIL_SECURE` — Use TLS (default: false)
- `EMAIL_USER` — SMTP username
- `EMAIL_PASS` — SMTP password
- `EMAIL_FROM` — Sender address (default: Society Maintenance <noreply@society.com>)

---

## Example Workflows

### Workflow 1: Submit Complaint (Resident)

```bash
# 1. Register
POST /auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123"
}
# Response: token (save for future requests)

# 2. Create complaint with photo
POST /complaints
Authorization: Bearer <token>
Content-Type: multipart/form-data

title=Broken tap
description=Tap in main hall is leaking
category=Maintenance
photo=@/path/to/photo.jpg

# 3. View own complaints
GET /complaints/my
Authorization: Bearer <token>
```

---

### Workflow 2: Manage Complaints (Admin)

```bash
# 1. Login as admin
POST /auth/login
{
  "email": "admin@society.com",
  "password": "admin123"
}
# Response: token

# 2. View all complaints
GET /complaints?status=Open&page=1&limit=10
Authorization: Bearer <token>

# 3. Flag overdue complaints
POST /complaints/flag-overdue
Authorization: Bearer <token>

# 4. Update complaint status (sends email to resident)
PATCH /complaints/5/status
Authorization: Bearer <token>
{
  "status": "In Progress",
  "note": "Assigned to maintenance team"
}

# 5. Update priority
PATCH /complaints/5/priority
Authorization: Bearer <token>
{
  "priority": "High",
  "note": "Multiple residents affected"
}
```

---

### Workflow 3: Send Notice (Admin)

```bash
# 1. Create important notice (emails all residents)
POST /notices
Authorization: Bearer <token>
{
  "title": "Scheduled maintenance",
  "content": "Water supply will be cut off on July 5th.",
  "isImportant": true
}

# 2. View all notices
GET /notices
Authorization: Bearer <token>

# 3. Delete notice
DELETE /notices/2
Authorization: Bearer <token>
```

---

## Health Check

#### `GET /health`

Simple health check endpoint (no authentication required).

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2026-07-03T10:30:00Z"
}
```
