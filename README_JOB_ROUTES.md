# Testing Job Routes with Postman

Quick guide to manually test the job-related API endpoints using Postman.

Prerequisites
- Run the backend server (default port `5000`) and ensure MongoDB is connected.
- If needed, create a test user via `POST /api/auth/register` and verify OTP via `POST /api/auth/verify-otp` to get a `token` in the response.

Environment (Postman)
- Create an environment and add:
  - `baseUrl` = `http://localhost:5000/api`
  - `AUTH_TOKEN` = `<paste token from verify-otp response>`

Common headers
- `Content-Type: application/json`
- `Authorization: Bearer {{AUTH_TOKEN}}` (for protected routes)

Endpoints

1) Get all jobs
- Method: GET
- URL: `{{baseUrl}}/jobs`
- Query params (optional): `location`, `search`, `salaryType`, `category`, `sort`
- Example: `GET {{baseUrl}}/jobs?location=Delhi&search=driver&sort=highestSalary`
- Response: `{ success: true, count, data: [...] }`

2) Get single job details
- Method: GET
- URL: `{{baseUrl}}/jobs/:id`
- Example: `GET {{baseUrl}}/jobs/644abc...`
- Response: `{ success: true, data: { ...job fields... } }`

3) Apply to a job (protected)
- Method: POST
- URL: `{{baseUrl}}/jobs/:id/apply`
- Headers: include `Authorization` (Bearer token)
- Body (JSON):
  ```json
  {
    "coverLetter": "I am interested in this role...",
    "experience": "3 years"
  }
  ```
- Success: HTTP 201 `{ success: true, message: 'Application submitted successfully', data: { ... } }`

4) Get applied jobs for an applicant (protected)
- Method: POST
- URL: `{{baseUrl}}/jobs/:id/getAppliedJobs`
- Notes: The `:id` is treated as the applicant's user id in the controller. Include `Authorization` header.
- Response: `{ success: true, data: [...] }`

How to test in Postman (quick)
1. Create a new request for each endpoint above.
2. For protected routes, set the `Authorization` header to `Bearer {{AUTH_TOKEN}}`.
3. Use the `baseUrl` environment variable so requests are portable.

Troubleshooting
- If you receive `401 Not authorized`, check that `Authorization` has `Bearer <token>` and token is not blacklisted (logout stores blacklisted tokens).
- If you get `404 Job not found`, confirm the `:id` is a valid Job ObjectId in the database.

Want a Postman collection? I can export a ready-to-import collection next.
