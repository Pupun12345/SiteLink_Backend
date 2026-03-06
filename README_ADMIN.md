# SiteLink Backend - Admin API

This document describes the **admin login API** and expected behavior for admin users.

> 🔒 **Admin Login URL (API)**

- **Endpoint:** `POST /api/auth/admin/login`
- **Base URL (local):** `http://localhost:5000`

---

## ✅ Request

### Headers
- `Content-Type: application/json`

### Body
```json
{
  "email": "admin@sitelink.in",
  "password": "<encrypted/hashed password stored in DB>"
}
```

> ⚠️ Note: The password must match the hashed password stored in MongoDB. 

---

## ✅ Successful Response

```json
{
  "success": true,
  "token": "<jwt-token>",
  "redirectTo": "/admin/dashboard",
  "user": {
    "id": "<user-id>",
    "name": "Admin Name",
    "email": "admin@sitelink.in",
    "role": "admin"
  }
}
```

### What to do next
- Store the returned token and send it on subsequent requests under:
  - `Authorization: Bearer <token>`
- The response includes `redirectTo: "/admin/dashboard"` as a hint for the frontend.

---

## 🔧 Notes
- The admin user must exist in the database with `role: "admin"`.
- The password is stored hashed; ensure you are providing the plaintext password that was used during admin creation.
- If you need to create an admin user manually, insert a user document into MongoDB with `role: "admin"` and a hashed password (using bcrypt).

---

## 🧩 Admin API Ideas (Future)
- Add a dedicated admin session endpoint to refresh tokens
- Add `/api/admin/users` for admin user management
- Add `/api/admin/reports` for analytics/dashboard data
