**Profile Controller — Postman Test Guide**

This document describes the endpoints provided by the `profileController` and gives example requests you can use in Postman (or curl) to test them.

**Base URL**: http://localhost:5000/api/profile

**Authentication**: Protected endpoints require a JSON Web Token (JWT) in the `Authorization` header: `Authorization: Bearer <token>` (see [backend/middleware/auth.js](middleware/auth.js#L1) for auth behavior).

**Common Response Format**
- success: boolean
- message: string (when present)
- data / user: object or array

---

**Endpoints**

- **Get current user profile**
  - Method: GET
  - Path: `/me`
  - Auth: required
  - Description: Returns basic profile information for the authenticated user.
  - Headers: `Authorization: Bearer <token>`
  - Example curl:
    ```bash
    curl -X GET "http://localhost:5000/api/profile/me" \
      -H "Authorization: Bearer <YOUR_JWT>" \
      -H "Content-Type: application/json"
    ```

- **Get list of states (public)**
  - Method: GET
  - Path: `/states`
  - Auth: not required
  - Description: Returns an array of states with `id` and `name`.
  - Example curl:
    ```bash
    curl -X GET "http://localhost:5000/api/profile/states"
    ```

- **Get cities for a state (public)**
  - Method: GET
  - Path: `/cities/:stateId`
  - Auth: not required
  - Params: `stateId` (integer)
  - Example curl:
    ```bash
    curl -X GET "http://localhost:5000/api/profile/cities/14"
    ```

- **Save work state and preferred city (set by ids)**
  - Method: POST
  - Path: `/location/:stateId/:cityId`
  - Auth: required
  - Description: Stores `workState` and `preferredCity` for the authenticated user.
  - Example curl:
    ```bash
    curl -X POST "http://localhost:5000/api/profile/location/14/1" \
      -H "Authorization: Bearer <YOUR_JWT>"
    ```

- **Get skills**
  - Method: GET
  - Path: `/skills`
  - Auth: required
  - Description: Returns skill documents (implementation note: the controller uses a model named `Skill`).
  - Example curl:
    ```bash
    curl -X GET "http://localhost:5000/api/profile/skills" \
      -H "Authorization: Bearer <YOUR_JWT>"
    ```

- **Update worker skills**
  - Method: POST
  - Path: `/skills/:primarySkillId/:secondarySkillId/:otherSkill`
  - Auth: required
  - Description: Set `primarySkill`, optional `secondarySkill`, and optional free-form `otherSkill` on the authenticated user's profile. The controller expects all three URL placeholders to be present; pass `0` or `none` for `secondarySkillId` or `otherSkill` when you don't want to set them.
  - Path params:
    - `primarySkillId` (required)
    - `secondarySkillId` (pass `0` or `none` if not used)
    - `otherSkill` (pass `0` or `none` if not used) — free-form text (URL-encoded when used in path)
  - Example: set primary=14, secondary=15 (no otherSkill)
    ```bash
    curl -X POST "http://localhost:5000/api/profile/skills/14/15/0" \
      -H "Authorization: Bearer <YOUR_JWT>"
    ```
  - Example: set primary and an `otherSkill` string (no secondary)
    ```bash
    curl -X POST "http://localhost:5000/api/profile/skills/14/0/Plumbing%20(maintenance)" \
      -H "Authorization: Bearer <YOUR_JWT>"
    ```

- **Create Worker Profile**
  - Method: POST
  - Path: `/create/worker`
  - Auth: required
  - Content type: `multipart/form-data` (uploads supported)
  - Fields (body form fields):
    - `primarySkill` (required)
    - `name` (optional)
    - `dateOfBirth` (optional, format YYYY-MM-DD)
    - `gender`, `additionalSkills` (JSON string or array), `totalExperience`, `experienceDescription`, `willingtoRelocate`, `salaryType`, `salary`, `workSamplesPhoto` (JSON string or array)
  - Files (multipart):
    - `profileImage` (single)
    - `workSamplesPhoto` (up to 5)
    - `experienceCertificate` (single)
    - `governmentID` (single)
  - Example Postman setup:
    - Set method to POST and URL to `http://localhost:5000/api/profile/create/worker`.
    - In Headers add `Authorization: Bearer <JWT>`.
    - Use `Body` → `form-data` and add key/value pairs. For files choose `File` type and attach files.
  - Minimal curl example (no files):
    ```bash
    curl -X POST "http://localhost:5000/api/profile/create/worker" \
      -H "Authorization: Bearer <YOUR_JWT>" \
      -F "primarySkill=Carpentry" \
      -F "name=John Doe" \
      -F "dateOfBirth=1990-05-01"
    ```

- **Edit Worker Profile**
  - Method: PUT
  - Path: `/edit/worker`
  - Auth: required
  - Same form-data fields and files as `create/worker`.

- **Create Vendor Profile**
  - Method: POST
  - Path: `/create/vendor`
  - Auth: required
  - Form fields: `companyName` (required), `name` (required), `email`, `designation` (required), `workArea`, `gstNumber`, `whatsappNumber`, `website`
  - Files: `profileImage`, `companyLogo`

- **Edit Vendor Profile**
  - Method: PUT
  - Path: `/edit/vendor`
  - Auth: required

---

**Postman Quick Guide**

1. Create a new environment with variable `baseUrl` = `http://localhost:5000` and `token` = `<YOUR_JWT>`.
2. Example request URL in Postman: `{{baseUrl}}/api/profile/me`
3. In `Headers` add `Authorization` with value `Bearer {{token}}`.
4. For form-data requests choose `Body` → `form-data`. Use `Key` names listed above (e.g. `primarySkill`, `profileImage`) and for file fields change type to `File`.
5. Send requests and inspect `success`, `message`, and `data` properties in the JSON response.

**Example Postman Request (Create Worker)**
- Method: POST
- URL: `{{baseUrl}}/api/profile/create/worker`
- Headers:
  - `Authorization: Bearer {{token}}`
  - `Content-Type` will be set automatically by Postman when using `form-data`
- Body (form-data):
  - `primarySkill`: `Plumbing`
  - `name`: `Ravi Kumar`
  - `dateOfBirth`: `1992-08-15`
  - `profileImage`: (File)

**Troubleshooting & Notes**
- Ensure your server is running and the configured port matches `baseUrl`.
- Protected endpoints require a valid JWT signed with `process.env.JWT_SECRET`.
- Date fields must be `YYYY-MM-DD` — invalid format returns 400.
- When uploading files, paths returned by the API will be server file paths.

**Controller Source**: [backend/controllers/profileController.js](backend/controllers/profileController.js)
