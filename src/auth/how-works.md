# NestJS Authentication System

This project implements a comprehensive authentication and authorization system using NestJS, MongoDB, JWT, Passport, Nodemailer, and Google OAuth.

## Features

- User Registration (Email/Password & Google OAuth)
- User Login (Email/Password & Google OAuth)
- Email Verification (OTP-based)
- Password Management (Forgot, Reset, Change Password)
- Profile Retrieval
- Role-Based Access Control (RBAC): Admin, Seller, Customer
- Seller Registration and Approval Workflow
- Admin functionalities: List users/sellers, approve/reject sellers, block/unblock users.
- Input Validation with `class-validator`
- Rate Limiting with `@nestjs/throttler`
- API Documentation with Swagger (OpenAPI)

## Technologies Used

- **NestJS:** A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- **MongoDB:** NoSQL database for flexible data storage.
- **Mongoose:** MongoDB object data modeling (ODM) for Node.js.
- **JWT (JSON Web Tokens):** For secure API authentication.
- **Passport.js:** Authentication middleware for Node.js.
  - `passport-jwt`: JWT strategy.
  - `passport-google-oauth20`: Google OAuth 2.0 strategy.
- **bcryptjs:** For hashing and comparing passwords.
- **Nodemailer:** For sending emails (OTP, password reset links).
- **class-validator & class-transformer:** For robust request body validation.
- **@nestjs/config:** For environment variable management.
- **@nestjs/throttler:** For rate limiting API requests.
- **@nestjs/swagger:** For OpenAPI (Swagger) API documentation.

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-link>
cd <your-repo-name>