# SiteLink Backend API

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env` file and update the values:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A secure secret key for JWT
     - `PORT`: Server port (default: 5000)

3. **Start MongoDB**
   - Make sure MongoDB is running on your machine
   - Or use MongoDB Atlas connection string

4. **Run the Server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes

#### 1. Register User
- **URL**: `POST /api/auth/register`
- **Content-Type**: `multipart/form-data` ⚠️ **Important: Uses form-data, not JSON**
- **Form Data Fields**:
  ```
  name: Rajesh Kumar (required)
  phone: 9876543210 (required - 10 digits)
  password: securePass123 (required - min 8 characters)
  confirmPassword: securePass123 (required - must match password)
  userType: customer (optional - customer/vendor/worker)
  profileImage: [Image File] (optional - max 5MB, jpg/png/gif/webp)
  ```
  **Note**: 
  - Use **form-data** in Postman, NOT raw JSON
  - Phone number must be 10 digits starting with 6, 7, 8, or 9
  - Password must be at least 8 characters
  - `userType` can be: `customer`, `vendor`, or `worker` (default: `customer`)
  - `profileImage` accepts jpg, png, gif, webp files up to 5MB
- **Response**:
  ```json
  {
    "success": true,
    "message": "Registration successful. OTP sent to +919876543210",
    "data": {
      "phone": "9876543210",
      "otp": "437208",
      "expiresIn": "10 minutes"
    }
  }
  ```
  **Note**: OTP is included in response for development. In production, it will be sent via SMS.

#### 2. Verify OTP
- **URL**: `POST /api/auth/verify-otp`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "phone": "9876543210",
    "otp": "437208"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "name": "Rajesh Kumar",
      "phone": "9876543210",
      "email": null,
      "userType": "customer",
      "role": "user",
      "profileImage": "uploads/profiles/profile-1771832951234-123456789.jpg"
    }
  }
  ```
  **Note**: 
  - OTP expires in 10 minutes
  - Maximum 3 verification attempts allowed
  - After 3 failed attempts, must request new OTP via resend
  - After successful verification, account is activated and JWT token is returned
  - `profileImage` contains the path to uploaded image (null if not uploaded)
  - Access images at: `http://localhost:5000/{profileImage}`

#### 3. Resend OTP
- **URL**: `POST /api/auth/resend-otp`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "phone": "9876543210"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "OTP resent successfully to +919876543210",
    "data": {
      "phone": "9876543210",
      "otp": "891234",
      "expiresIn": "10 minutes"
    }
  }
  ```
  **Note**: 
  - Resend OTP resets the attempt counter to 0
  - Old OTP becomes invalid immediately
  - New OTP expires in 10 minutes

#### 4. Login User
- **URL**: `POST /api/auth/login`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "phone": "9876543210",
    "password": "securePass123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "name": "Rajesh Kumar",
      "phone": "9876543210",
      "email": null,
      "userType": "customer",
      "role": "user",
      "profileImage": "uploads/profiles/profile-1771832951234-123456789.jpg"
    }
  }
  ```
  **Note**: Login is only allowed for verified accounts. Unverified users will receive an error.

## User Types

The API supports three user types:
- **customer**: Regular users (default)
- **vendor**: Service providers/vendors
- **worker**: Workers associated with vendors

All three types use the same registration and login endpoints but can be differentiated by the `userType` field.
  ```

## Postman Testing Guide

**📖 For detailed testing guide, see:** [PHONE_AUTH_API_GUIDE.md](PHONE_AUTH_API_GUIDE.md)

1. **Start the Server**
   ```bash
   npm run dev
   ```

2. **Test Register** ⚠️ **Use form-data, NOT JSON**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/register`
   - Body Type: **form-data** (select from dropdown)
   - Fields:
     - name: Rajesh Kumar
     - phone: 9876543210
     - password: securePass123
     - confirmPassword: securePass123
     - userType: customer
     - profileImage: [Select Image File - Optional]
   - **Important**: Copy the OTP from the response (e.g., "437208")

3. **Test Verify OTP**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/verify-otp`
   - Body Type: raw JSON
   - Body:
     ```json
     {
       "phone": "9876543210",
       "otp": "437208"
     }
     ```
   - **Important**: Use the OTP from registration. Copy the token from this response.

4. **Test Resend OTP** (if needed)
   - Method: POST
   - URL: `http://localhost:5000/api/auth/resend-otp`
   - Body Type: raw JSON
   - Body:
     ```json
     {
       "phone": "9876543210"
     }
     ```

5. **Test Login**
   ```bash
   npm run dev
   ```

2. **Test Register** ⚠️ **Use form-data, NOT JSON**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/register`
   - Body Type: **form-data** (select from dropdown)
   - Fields:
     - name: Test User
     - email: test@example.com
     - password: test123456
     - userType: customer
     - profileImage: [Select Image File - Optional]
   - **Important**: Copy the OTP from the response (e.g., "437208")
   - **For detailed instructions**, see [FORM_DATA_API_GUIDE.md](FORM_DATA_API_GUIDE.md)

3. **Test Verify OTP**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/verify-otp`
   - Body Type: raw JSON
   - Body:
     ```json
     {
       "email": "test@example.com",
       "otp": "437208"
     }
     ```
   - **Important**: Use the OTP received in the registration response. Copy the token from this response.

4. **Test Login**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/login`
   - Body Type: raw JSON
   - Body:
     ```json
     {
       "email": "test@example.com",
       "password": "test123456"
     }
     ```
   - **Note**: Login only works after OTP verification

## Project Structure

```
SiteLink_Backend/
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   └── authController.js    # Authentication logic
├── middleware/
│   ├── auth.js              # JWT verification middleware
│   └── upload.js            # File upload configuration (multer)
├── models/
│   └── User.js              # User schema
├── routes/
│   └── authRoutes.js        # Auth route definitions
├── uploads/                 # Uploaded files (auto-created, git-ignored)
│   └── profiles/            # Profile images
├── utils/
│   ├── tokenUtils.js        # JWT token utilities
│   └── otpUtils.js          # OTP generation utilities
├── .env                     # Environment variables
├── .gitignore              # Git ignore file
├── package.json            # Dependencies
├── server.js               # Entry point
├── README.md               # This file
├── FORM_DATA_API_GUIDE.md  # Detailed form-data testing guide
└── OTP_VERIFICATION_GUIDE.md # OTP verification guide
```

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- **6-digit OTP verification** for new registrations
- OTP expiration (10 minutes)
- Account verification required before login
- **Image upload with validation** (file type and size limits)
- **File type filtering** (only jpg, png, gif, webp allowed)
- **File size limit** (5MB maximum)
- Input validation with express-validator
- CORS enabled
- Protected routes with middleware
- Password and OTP not returned in API responses

## Tech Stack

- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **multer** - File upload handling
- **express-validator** - Input validation
