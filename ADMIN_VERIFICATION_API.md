# Admin Verification API Documentation

## Base URL
```
http://localhost:5000/api/admin
```

## Authentication
All endpoints require:
- **Header**: `Authorization: Bearer <token>`
- **Role**: Admin only

---

## Worker Verification Endpoints

### 1. Get Pending Workers
**Endpoint**: `GET /workers/pending`

**Description**: Retrieve list of all workers awaiting verification

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Raj Kumar",
      "phone": "9876543210",
      "role": "Plumber",
      "experience": "3-5 Years",
      "city": "Mumbai",
      "profileImage": "https://example.com/profile.jpg",
      "verificationStatus": "pending"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Amit Singh",
      "phone": "9876543211",
      "role": "Electrician",
      "experience": "1-3 Years",
      "city": "Delhi",
      "profileImage": "https://example.com/profile2.jpg",
      "verificationStatus": "pending"
    }
  ]
}
```

---

### 2. Get Worker Details
**Endpoint**: `GET /workers/:id`

**Description**: Retrieve detailed information of a specific worker for verification

**Parameters**:
- `id` (path): Worker's MongoDB ID

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Example Request**:
```
GET /api/admin/workers/507f1f77bcf86cd799439011
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Raj Kumar",
    "age": 32,
    "phone": "9876543210",
    "experience": "3-5 Years",
    "city": "Mumbai",
    "dailyRate": 500,
    "profileImage": "https://example.com/profile.jpg",
    "aadhaarFrontImage": "https://example.com/aadhaar_front.jpg",
    "aadhaarBackImage": "https://example.com/aadhaar_back.jpg",
    "certificates": [
      "https://example.com/cert1.pdf",
      "https://example.com/cert2.pdf"
    ],
    "verificationStatus": "pending",
    "isVerified": false,
    "skills": [
      {
        "skillId": 1,
        "skillName": "Plumbing"
      },
      {
        "skillId": 2,
        "skillName": "Pipe Fitting"
      }
    ]
  }
}
```

---

### 3. Approve Worker Verification
**Endpoint**: `PUT /workers/:id/verify`

**Description**: Approve and verify a worker's documents

**Parameters**:
- `id` (path): Worker's MongoDB ID

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**: (Empty)
```json
{}
```

**Example Request**:
```
PUT /api/admin/workers/507f1f77bcf86cd799439011
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Worker verified successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "verificationStatus": "verified",
    "isVerified": true
  }
}
```

---

### 4. Reject Worker Verification
**Endpoint**: `PUT /workers/:id/reject`

**Description**: Reject a worker's verification with a reason

**Parameters**:
- `id` (path): Worker's MongoDB ID

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "reason": "Aadhaar document is not clear"
}
```

**Example Request**:
```
PUT /api/admin/workers/507f1f77bcf86cd799439011
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Worker verification rejected",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "verificationStatus": "rejected",
    "rejectionReason": "Aadhaar document is not clear"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Rejection reason is required"
}
```

---

## Vendor Verification Endpoints

### 5. Get Pending Vendors
**Endpoint**: `GET /vendors/pending`

**Description**: Retrieve list of all vendors awaiting verification

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "607f1f77bcf86cd799439021",
      "companyName": "BuildTech Solutions",
      "ownerName": "Priya Sharma",
      "phone": "9876543220",
      "city": "Bangalore",
      "companyLogo": "https://example.com/logo1.jpg",
      "verificationStatus": "pending"
    },
    {
      "_id": "607f1f77bcf86cd799439022",
      "companyName": "ConstructPro",
      "ownerName": "Vikram Patel",
      "phone": "9876543221",
      "city": "Pune",
      "companyLogo": "https://example.com/logo2.jpg",
      "verificationStatus": "pending"
    }
  ]
}
```

---

### 6. Get Vendor Details
**Endpoint**: `GET /vendors/:id`

**Description**: Retrieve detailed information of a specific vendor for verification

**Parameters**:
- `id` (path): Vendor's MongoDB ID

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Example Request**:
```
GET /api/admin/vendors/607f1f77bcf86cd799439021
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439021",
    "companyName": "BuildTech Solutions",
    "ownerName": "Priya Sharma",
    "phone": "9876543220",
    "email": "priya@buildtech.com",
    "city": "Bangalore",
    "gstNumber": "18AABCT1234H1Z0",
    "panNumber": "ABCDE1234F",
    "licenseNumber": "LIC123456",
    "panCardImage": "https://example.com/pan.jpg",
    "companyLogo": "https://example.com/logo.jpg",
    "verificationStatus": "pending",
    "isVerified": false,
    "projectTypes": [
      "Residential Building",
      "Commercial Building"
    ]
  }
}
```

---

### 7. Approve Vendor Verification
**Endpoint**: `PUT /vendors/:id/verify`

**Description**: Approve and verify a vendor's documents

**Parameters**:
- `id` (path): Vendor's MongoDB ID

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**: (Empty)
```json
{}
```

**Example Request**:
```
PUT /api/admin/vendors/607f1f77bcf86cd799439021
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Vendor verified successfully",
  "data": {
    "id": "607f1f77bcf86cd799439021",
    "verificationStatus": "verified",
    "isVerified": true
  }
}
```

---

### 8. Reject Vendor Verification
**Endpoint**: `PUT /vendors/:id/reject`

**Description**: Reject a vendor's verification with a reason

**Parameters**:
- `id` (path): Vendor's MongoDB ID

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "reason": "GST certificate is expired"
}
```

**Example Request**:
```
PUT /api/admin/vendors/607f1f77bcf86cd799439021
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Vendor verification rejected",
  "data": {
    "id": "607f1f77bcf86cd799439021",
    "verificationStatus": "rejected",
    "rejectionReason": "GST certificate is expired"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Rejection reason is required"
}
```

---

## Error Responses

### 404 Not Found
```json
{
  "success": false,
  "message": "Worker not found"
}
```
or
```json
{
  "success": false,
  "message": "Vendor not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## Postman Collection Import

### Quick Setup Steps:
1. Open Postman
2. Create a new collection named "SiteLink Admin Verification"
3. Add the following requests:

### Worker Verification Requests:

**Request 1: Get Pending Workers**
- Method: GET
- URL: `{{base_url}}/api/admin/workers/pending`
- Headers: `Authorization: Bearer {{admin_token}}`

**Request 2: Get Worker Details**
- Method: GET
- URL: `{{base_url}}/api/admin/workers/{{worker_id}}`
- Headers: `Authorization: Bearer {{admin_token}}`

**Request 3: Approve Worker**
- Method: PUT
- URL: `{{base_url}}/api/admin/workers/{{worker_id}}/verify`
- Headers: `Authorization: Bearer {{admin_token}}`
- Body: (none)

**Request 4: Reject Worker**
- Method: PUT
- URL: `{{base_url}}/api/admin/workers/{{worker_id}}/reject`
- Headers: `Authorization: Bearer {{admin_token}}`
- Body (JSON):
```json
{
  "reason": "Document not clear"
}
```

### Vendor Verification Requests:

**Request 5: Get Pending Vendors**
- Method: GET
- URL: `{{base_url}}/api/admin/vendors/pending`
- Headers: `Authorization: Bearer {{admin_token}}`

**Request 6: Get Vendor Details**
- Method: GET
- URL: `{{base_url}}/api/admin/vendors/{{vendor_id}}`
- Headers: `Authorization: Bearer {{admin_token}}`

**Request 7: Approve Vendor**
- Method: PUT
- URL: `{{base_url}}/api/admin/vendors/{{vendor_id}}/verify`
- Headers: `Authorization: Bearer {{admin_token}}`
- Body: (none)

**Request 8: Reject Vendor**
- Method: PUT
- URL: `{{base_url}}/api/admin/vendors/{{vendor_id}}/reject`
- Headers: `Authorization: Bearer {{admin_token}}`
- Body (JSON):
```json
{
  "reason": "GST certificate expired"
}
```

---

## Environment Variables for Postman

Create an environment with these variables:
```
base_url: http://localhost:5000
admin_token: <your_admin_jwt_token>
worker_id: 507f1f77bcf86cd799439011
vendor_id: 607f1f77bcf86cd799439021
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (missing/invalid data) |
| 404 | Not Found (worker/vendor doesn't exist) |
| 500 | Server Error |

---

## Notes

- All timestamps are in ISO 8601 format
- `verificationReviewedAt` is automatically set when verification is approved/rejected
- Worker/Vendor cannot be verified twice
- Rejection reason is required and must be a non-empty string
