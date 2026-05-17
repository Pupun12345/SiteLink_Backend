# Community & Related API Routes

This document lists the community-related endpoints and other related routes used by the Flutter frontend. Base URL: `{{BASE_URL}}/api` (replace `{{BASE_URL}}` with your server address, e.g., `https://example.com` or `http://10.0.2.2:5000` for Android emulator).

**Authentication**: Protected endpoints require an `Authorization` header: `Bearer <JWT_TOKEN>`.

**Uploads**: Endpoints that accept images/videos use `multipart/form-data`. Fields:
- `images` (array) — up to 5
- `video` (single) — max 1
- Other text fields are sent as form fields

---

**Community Routes**

- **GET**: `/community/feed`
  - Path: `/api/community/feed`
  - Auth: Protected (`protect`)
  - Query params: `page` (default 1), `limit` (default 10), `posterType` (optional)
  - Description: Returns paginated posts feed (vendors/workers).
  - Example (curl):

```bash
curl -H "Authorization: Bearer <TOKEN>" "{{BASE_URL}}/api/community/feed?page=1&limit=10"
```

- **POST**: `/community/posts`
  - Path: `/api/community/posts`
  - Auth: Protected
  - Body: multipart/form-data with fields:
    - `content` (string)
    - `feeling` (string, optional)
    - `images` files (field name `images` repeated)
    - `video` file (field name `video`)
  - Description: Create a new post with optional images/video.
  - Flutter tip: Use `http.MultipartRequest` and add `files` for `images` and `video`.

- **PUT**: `/community/posts/:postId/like`
  - Path: `/api/community/posts/:postId/like`
  - Auth: Protected
  - Body: none
  - Description: Toggle like/unlike for a post.
  - Example (curl):

```bash
curl -X PUT -H "Authorization: Bearer <TOKEN>" "{{BASE_URL}}/api/community/posts/POST_ID/like"
```

- **DELETE**: `/community/posts/:postId`
  - Path: `/api/community/posts/:postId`
  - Auth: Protected (only owner or admin)
  - Description: Delete a post.

**Comments (on posts)**

- **POST**: `/community/posts/:id/comments`
  - Path: `/api/community/posts/:id/comments`
  - Auth: Protected
  - Body (JSON): `{ "comment": "text", "parentComment": "optional_parent_comment_id" }`
  - Description: Add a comment or reply.

- **PUT**: `/community/posts/:postId/comments/:commentId`
  - Path: `/api/community/posts/:postId/comments/:commentId`
  - Auth: Protected
  - Body (JSON): `{ "comment": "updated text" }`
  - Description: Update a comment (owner only).

- **DELETE**: `/community/posts/:postId/comments/:commentId`
  - Path: `/api/community/posts/:postId/comments/:commentId`
  - Auth: Protected
  - Description: Soft-delete a comment (owner or admin).

- **GET**: `/community/posts/:id/comments`
  - Path: `/api/community/posts/:id/comments`
  - Auth: Public
  - Query params: `page`, `limit`, `sortBy` (`newest`|`oldest`|`popular`)
  - Description: Get paginated comments for a post.

---

**Auth Routes (used by Flutter)**

- **POST** `/auth/register`
  - Path: `/api/auth/register`
  - Body (JSON): `{ "phone": "9876543210" }`
  - Description: Triggers OTP for registration/phone.

- **POST** `/auth/verify-otp`
  - Path: `/api/auth/verify-otp`
  - Body (JSON): `{ "phone": "9876543210", "otp": "123456" }`
  - Description: Verify OTP and returns JWT token on success.

- **GET** `/auth/me`
  - Path: `/api/auth/me`
  - Auth: Protected
  - Description: Get current user profile.

- **POST** `/auth/logout`
  - Path: `/api/auth/logout`
  - Auth: Protected
  - Description: Blacklists token (logout).

---

**Profile Routes (used by Flutter)**

- **GET** `/profile/me`
  - Path: `/api/profile/me`
  - Auth: Protected
  - Description: Get profile info for current user.

- **GET** `/profile/states`
  - Path: `/api/profile/states`
  - Auth: Public
  - Description: Get available states.

- **GET** `/profile/cities/:stateId`
  - Path: `/api/profile/cities/:stateId`
  - Auth: Public
  - Description: Get cities for a state.

- **POST** `/profile/location/:stateId/:cityId`
  - Path: `/api/profile/location/:stateId/:cityId`
  - Auth: Protected
  - Description: Save/get location by IDs.

- **GET** `/profile/skills` and **POST** `/profile/skills`
  - Path: `/api/profile/skills`
  - Auth: Protected
  - Description: Retrieve and update worker skills.

- **POST** `/profile/create/worker`, `/profile/create/vendor`
  - Path: `/api/profile/create/worker` and `/api/profile/create/vendor`
  - Auth: Protected
  - Body: multipart/form-data (profile image, documents)
  - Description: Create worker/vendor profiles.

- **PUT** `/profile/edit/worker` and `/profile/edit/vendor`
  - Path: `/api/profile/edit/worker` and `/api/profile/edit/vendor`
  - Auth: Protected
  - Body: multipart/form-data
  - Description: Edit profiles.

---

**Jobs Routes (used by Flutter)**

- **GET** `/jobs`
  - Path: `/api/jobs`
  - Auth: Public
  - Query params: `location`, `search`, `salaryType`, `category`, `sort`
  - Description: List jobs with filters.

- **GET** `/jobs/:id`
  - Path: `/api/jobs/:id`
  - Auth: Public
  - Description: Job details.

- **POST** `/jobs/:id/apply`
  - Path: `/api/jobs/:id/apply`
  - Auth: Protected + `applicable` middleware
  - Body: JSON `{ "coverLetter": "...", "experience": "..." }`
  - Description: Apply to a job (worker verified users only).

- **POST** `/jobs/:id/getAppliedJobs`
  - Path: `/api/jobs/:id/getAppliedJobs`
  - Auth: Protected
  - Description: Get applied jobs for a user (uses :id param as applicant id).

---

**Headers & Flutter integration notes**

- Authorization header (add to all protected requests):
  - `Authorization: Bearer <TOKEN>`

- For multipart upload from Flutter (`http` package):
  - Use `http.MultipartRequest('POST', Uri.parse(url))`.
  - Add fields via `request.fields['content'] = '...'`.
  - Add multiple images via `request.files.add(await http.MultipartFile.fromPath('images', path))`.
  - Add video with field name `video`.
  - Add header: `request.headers['Authorization'] = 'Bearer $token'`.

- Example Flutter snippet for a protected GET (using `http` package):

```dart
final res = await http.get(Uri.parse('$baseUrl/api/community/feed?page=1'),
  headers: { 'Authorization': 'Bearer $token' },
);
```

---

**Common response format**

Most endpoints return JSON with the shape:

```json
{
  "success": true|false,
  "message": "...",
  "data": { ... },
  "pagination": { ... } // optional
}
```

---

If you want, I can:
- Add example Flutter code per endpoint (detailed multipart upload snippet).
- Add Postman collection or curl script to test all endpoints.

File saved: [backend/README_COMMUNITY_ROUTES.md](backend/README_COMMUNITY_ROUTES.md)
