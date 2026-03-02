# Help & Support API

This document provides Postman-friendly examples for testing the Help & Support endpoints.

## 1. Submit a Help/Support Request (Public)

- **Method**: `POST`
- **URL**: `http://localhost:5000/api/help-support`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON)**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "subject": "Issue with profile",
    "message": "I am unable to upload my profile image."
  }
  ```

> In Postman:
> 1. Select **POST**.
> 2. Enter URL above.
> 3. Under **Headers**, add `Content-Type: application/json`.
> 4. Go to **Body** → **raw** → **JSON**, paste the example JSON.
> 5. Click **Send**.

- **Successful Response** (201):
  ```json
  {
    "success": true,
    "message": "Your request has been submitted successfully",
    "data": {
      "_id": "64c196...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "subject": "Issue with profile",
      "message": "I am unable to upload my profile image.",
      "createdAt": "2026-03-02T10:20:30.123Z",
      "__v": 0
    }
  }
  ```

> **Note**: If you are logged in (include `Authorization: Bearer <token>`), the request will automatically record your user ID and fill in name/email/phone from your profile when left blank. Posting without authentication still works.

## 2. List All Tickets (Admin Only)

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/help-support`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <admin_token>`

> Replace `<admin_token>` with a valid JWT issued to a user whose `role` is `admin`.

- **Successful Response** (200):
  ```json
  {
    "success": true,
    "count": 3,
    "data": [
      {
        "_id": "64c196...",
        "user": {
          "_id": "64c18f...",
          "name": "Rajesh Kumar",
          "phone": "9876543210",
          "email": "rajesh@example.com",
          "role": "user",
          "userType": "customer"
        },
        "name": "Rajesh Kumar",
        "email": "rajesh@example.com",
        "phone": "9876543210",
        "subject": "Login problem",
        "message": "Cannot login after OTP verification.",
        "createdAt": "2026-03-01T14:00:00.000Z",
        "__v": 0
      },
      ...
    ]
  }
  ```

## 3. Get Ticket by ID (Admin Only)

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/help-support/<ticket_id>`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <admin_token>`

> Replace `<ticket_id>` with the `_id` value from a ticket (returned by listing or creation).

- **Successful Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "_id": "64c196...",
      "user": null,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "subject": "Issue with profile",
      "message": "I am unable to upload my profile image.",
      "createdAt": "2026-03-02T10:20:30.123Z",
      "__v": 0
    }
  }
  ```
