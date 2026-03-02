# User-Specific Profile API

## Overview
User-specific profile APIs allow authenticated users to create and update their profiles based on their user type (customer, worker, or vendor). Each user type has dedicated endpoints with specific fields and validation rules.

## Authentication

All profile endpoints require JWT authentication:
```
Authorization: Bearer <your_jwt_token>
```

**Note**: The JWT token must be obtained after successful phone verification during registration.

---

## Customer Profile

### 1. Create Customer Profile
- **URL**: `POST /api/profile/customer/create`
- **Content-Type**: `multipart/form-data` ⚠️ **Important: Uses form-data, not JSON**
- **Authentication**: Required (userType must be `customer`)
- **Form Data Fields**:
  ```
  name: Rajesh Kumar (optional)
  email: rajesh@example.com (optional)
  city: Mumbai (optional)
  profileImage: [Image File] (optional - max 5MB, jpg/png/gif/webp)
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Customer profile created successfully",
    "user": {
      "id": "user_id",
      "name": "Rajesh Kumar",
      "phone": "9876543210",
      "email": "rajesh@example.com",
      "userType": "customer",
      "profileImage": "uploads/profiles/profile-1234567890.jpg",
      "city": "Mumbai"
    }
  }
  ```
  **Note**: 
  - Access images at: `http://localhost:5000/{profileImage}`
  - Only provide fields that need to be updated

### 2. Edit Customer Profile
- **URL**: `PUT /api/profile/customer/edit`
- **Content-Type**: `multipart/form-data`
- **Authentication**: Required (userType must be `customer`)
- **Form Data Fields**:
  - Same as create, only include fields to update
- **Response**:
  ```json
  {
    "success": true,
    "message": "Customer profile updated successfully",
    "user": {
      "id": "user_id",
      "name": "Rajesh Kumar",
      "phone": "9876543210",
      "email": "rajesh@example.com",
      "userType": "customer",
      "profileImage": "uploads/profiles/profile-1234567890.jpg",
      "city": "Pune"
    }
  }
  ```
  **Note**: Old images are automatically deleted when uploading new ones

---

## Worker Profile

### 1. Create Worker Profile
- **URL**: `POST /api/profile/worker/create`
- **Content-Type**: `multipart/form-data`
- **Authentication**: Required (userType must be `worker`)
- **Form Data Fields**:
  ```
  name: Suresh Yadav (optional)
  email: suresh@example.com (optional)
  city: Delhi (required)
  dailyRate: 1500 (required - numeric value)
  aadhaarNumber: 123456789012 (required - exactly 12 digits)
  experience: 3-5 Years (required - enum: "0-1 Year", "1-3 Years", "3-5 Years", "5+ Years")
  skills: [{"skillId":1,"skillName":"Plumbing"}] (required - JSON array)
  profileImage: [Image File] (optional - max 5MB)
  aadhaarFrontImage: [Image File] (required - max 5MB)
  aadhaarBackImage: [Image File] (required - max 5MB)
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Worker profile created successfully",
    "user": {
      "id": "user_id",
      "name": "Suresh Yadav",
      "phone": "9876543210",
      "email": "suresh@example.com",
      "userType": "worker",
      "profileImage": "uploads/profiles/profile-1234567890.jpg",
      "city": "Delhi",
      "dailyRate": 1500,
      "aadhaarNumber": "123456789012",
      "experience": "3-5 Years",
      "skills": [
        {"skillId": 1, "skillName": "Plumbing"},
        {"skillId": 2, "skillName": "Electrical"}
      ],
      "aadhaarFrontImage": "uploads/documents/aadhaar-front-1234567890.jpg",
      "aadhaarBackImage": "uploads/documents/aadhaar-back-1234567890.jpg"
    }
  }
  ```
  **Note**: 
  - Skills must be provided as JSON string array: `[{"skillId":1,"skillName":"Plumbing"}]`
  - Both Aadhaar images are required for verification
  - Aadhaar number must be exactly 12 digits

### 2. Edit Worker Profile
- **URL**: `PUT /api/profile/worker/edit`
- **Content-Type**: `multipart/form-data`
- **Authentication**: Required (userType must be `worker`)
- **Form Data Fields**:
  - Same as create, only include fields to update
- **Response**:
  ```json
  {
    "success": true,
    "message": "Worker profile updated successfully",
    "user": {
      "id": "user_id",
      "name": "Suresh Yadav",
      "phone": "9876543210",
      "email": "suresh@example.com",
      "userType": "worker",
      "city": "Pune",
      "dailyRate": 1800,
      "experience": "5+ Years"
    }
  }
  ```

---

## Vendor Profile

### 1. Create Vendor Profile
- **URL**: `POST /api/profile/vendor/create`
- **Content-Type**: `multipart/form-data`
- **Authentication**: Required (userType must be `vendor`)
- **Form Data Fields**:
  ```
  name: Amit Sharma (optional)
  email: amit@example.com (optional)
  city: Bangalore (optional)
  ownerName: Amit Sharma (required)
  companyName: Sharma Constructions (required)
  panNumber: ABCDE1234F (required - format: ABCDE1234F)
  gstNumber: 29ABCDE1234F1Z5 (optional - 15 characters)
  licenseNumber: LIC123456 (optional)
  projectTypes: ["Residential","Commercial"] (optional - JSON array)
  profileImage: [Image File] (optional - max 5MB)
  companyLogo: [Image File] (optional - max 5MB)
  panCardImage: [Image File] (required - max 5MB)
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Vendor profile created successfully",
    "user": {
      "id": "user_id",
      "name": "Amit Sharma",
      "phone": "9876543210",
      "email": "amit@example.com",
      "userType": "vendor",
      "profileImage": "uploads/profiles/profile-1234567890.jpg",
      "city": "Bangalore",
      "ownerName": "Amit Sharma",
      "companyName": "Sharma Constructions",
      "panNumber": "ABCDE1234F",
      "gstNumber": "29ABCDE1234F1Z5",
      "licenseNumber": "LIC123456",
      "projectTypes": ["Residential Building", "Commercial Building"],
      "companyLogo": "uploads/profiles/company-logo-1234567890.jpg",
      "panCardImage": "uploads/documents/pan-1234567890.jpg"
    }
  }
  ```
  **Note**:
  - PAN format must be: ABCDE1234F (5 letters, 4 digits, 1 letter)
  - GST number must be exactly 15 characters
  - projectTypes must be provided as JSON array: `["Residential Building","Commercial Building"]`
  - PAN Card image is required for verification

### 2. Edit Vendor Profile
- **URL**: `PUT /api/profile/vendor/edit`
- **Content-Type**: `multipart/form-data`
- **Authentication**: Required (userType must be `vendor`)
- **Form Data Fields**:
  - Same as create, only include fields to update
- **Response**:
  ```json
  {
    "success": true,
    "message": "Vendor profile updated successfully",
    "user": {
      "id": "user_id",
      "name": "Amit Sharma",
      "phone": "9876543210",
      "userType": "vendor",
      "companyName": "Sharma & Sons Constructions",
      "gstNumber": "29ABCDE1234F1Z6"
    }
  }
  ```

---

## Get My Profile (All User Types)

### Get Complete Profile
- **URL**: `GET /api/profile/me`
- **Content-Type**: `application/json`
- **Authentication**: Required
- **Response** (returns complete profile based on user type):
  ```json
  {
    "success": true,
    "user": {
      "id": "user_id",
      "name": "Suresh Yadav",
      "phone": "9876543210",
      "email": "suresh@example.com",
      "userType": "worker",
      "role": "user",
      "profileImage": "uploads/profiles/profile-1234567890.jpg",
      "city": "Delhi",
      "dailyRate": 1500,
      "aadhaarNumber": "123456789012",
      "experience": "3-5 Years",
      "skills": [
        {"skillId": 1, "skillName": "Plumbing"}
      ],
      "isVerified": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
  ```
  **Note**: Response structure varies based on userType. Fields not applicable to the user type will be null.

---

## Error Responses

### 403 Forbidden - Wrong User Type
```json
{
  "success": false,
  "message": "Access denied"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Error message details"
}
```

---

## Testing with Postman

### Setup
1. Get JWT token from `/api/auth/register` or `/api/auth/verify-otp`
2. Copy the token value
3. Add to request header: `Authorization: Bearer <token>`

### Customer Profile Test
- **Create**: POST `http://localhost:5000/api/profile/customer/create`
  - Body Type: form-data
  - Fields: name, email, city, profileImage
- **Edit**: PUT `http://localhost:5000/api/profile/customer/edit`
  - Body Type: form-data
  - Fields: (only fields to update)
- **Get**: GET `http://localhost:5000/api/profile/me`

### Worker Profile Test
- **Create**: POST `http://localhost:5000/api/profile/worker/create`
  - Body Type: form-data
  - Fields: name, email, city, dailyRate, aadhaarNumber, experience, skills, profileImage, aadhaarFrontImage, aadhaarBackImage
- **Edit**: PUT `http://localhost:5000/api/profile/worker/edit`
  - Body Type: form-data
  - Fields: (only fields to update)

### Vendor Profile Test
- **Create**: POST `http://localhost:5000/api/profile/vendor/create`
  - Body Type: form-data
  - Fields: name, email, city, ownerName, companyName, panNumber, gstNumber, licenseNumber, projectTypes, profileImage, companyLogo, panCardImage
- **Edit**: PUT `http://localhost:5000/api/profile/vendor/edit`
  - Body Type: form-data
  - Fields: (only fields to update)

---

## Key Features

1. **User Type Validation**: Each endpoint validates userType before allowing access
2. **Selective Updates**: Edit endpoints only update provided fields
3. **Automatic Cleanup**: Old images are automatically deleted when new ones are uploaded
4. **JSON Parsing**: Skills and projectTypes are automatically parsed from JSON strings
5. **File Validation**: Images are validated for format and size (max 5MB)
6. **Access Control**: Users can only access endpoints matching their userType
7. **Security**: Sensitive fields like password cannot be changed through profile endpoints
