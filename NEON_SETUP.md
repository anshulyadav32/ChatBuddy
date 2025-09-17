# Neon Database + Custom Auth Setup Guide

This guide covers the complete setup for the chat app using Neon database with custom JWT-based authentication.

## 🗄️ Neon Database Setup

### 1. Create Neon Account and Database

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Copy your connection string from the dashboard
4. It should look like: `postgresql://username:password@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require`

### 2. Run Database Schema

1. Open the Neon SQL console in your dashboard
2. Copy and paste the contents of `neon-schema.sql`
3. Execute the SQL to create all tables and functions

### 3. Environment Configuration

Create or update your `.env.local` file:

```bash
# Neon Database Configuration
EXPO_PUBLIC_DATABASE_URL=postgresql://username:password@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require

# Authentication Configuration
EXPO_PUBLIC_JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001/api

# App Configuration
EXPO_PUBLIC_SITE_URL=https://your-app.com
EXPO_PUBLIC_ENVIRONMENT=development
```

### 4. Update app.json

```json
{
  "expo": {
    "extra": {
      "databaseUrl": "postgresql://username:password@host/database",
      "jwtSecret": "your-jwt-secret-key",
      "apiBaseUrl": "http://localhost:3001/api"
    }
  }
}
```

## 🔐 Authentication System Overview

### Architecture

The new authentication system uses:

- **Neon PostgreSQL** for data storage
- **Custom JWT tokens** for session management
- **bcrypt-style hashing** for passwords (simplified for demo)
- **AsyncStorage** for persistent sessions
- **Mock API** for development (replace with real backend)

### Key Components

1. **`utils/database.ts`** - Database operations and types
2. **`utils/auth.ts`** - Authentication API and session management
3. **`utils/jwt.ts`** - JWT utilities and password hashing
4. **`hooks/useAuth.ts`** - React hook for authentication state
5. **`neon-schema.sql`** - Complete database schema

## 📱 Features

### ✅ Authentication Features

- **Email/Password Registration** with validation
- **Secure Login** with JWT tokens
- **Password Reset** via email (mock implementation)
- **Email Verification** for new accounts
- **Remember Me** functionality
- **Persistent Sessions** with auto-refresh
- **Secure Logout** with session cleanup

### ✅ Database Features

- **User Management** with profiles
- **Chat System** with participants
- **Real-time Messaging** (polling-based, upgradeable to WebSocket)
- **Session Management** with expiration
- **Automatic Triggers** for data consistency

### ✅ Security Features

- **Password Hashing** (simplified for demo)
- **JWT Token Validation** with expiration
- **Input Validation** and sanitization
- **Session Cleanup** on logout
- **Database Constraints** and foreign keys

## 🚀 Development vs Production

### Development Mode

The app includes mock implementations for development:

- **MockAuthAPI** - Simulates authentication without backend
- **MockDatabase** - In-memory data storage
- **Console Logging** - Email sending simulation
- **Polling Updates** - Simple real-time simulation

### Production Setup

For production, you'll need:

1. **Backend API Server** - Implement the auth endpoints
2. **Email Service** - SendGrid, AWS SES, etc.
3. **WebSocket Server** - For real-time messaging
4. **Proper JWT Signing** - Server-side with secure secrets
5. **Rate Limiting** - Prevent abuse
6. **HTTPS** - Secure connections

## 🔧 API Endpoints (To Implement)

### Authentication Endpoints

```
POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/signout
POST /api/auth/refresh
POST /api/auth/reset-password
POST /api/auth/update-password
POST /api/auth/verify-email
```

### Chat Endpoints

```
GET /api/chats
POST /api/chats
GET /api/chats/:id/messages
POST /api/chats/:id/messages
GET /api/users
GET /api/profile
PUT /api/profile
```

## 🧪 Testing the System

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

1. Create `.env.local` with your Neon database URL
2. Update `app.json` with your configuration
3. Run the database schema in Neon console

### 3. Start Development Server

```bash
npm run web
```

### 4. Test Authentication Flow

1. **Sign Up**: Create a new account
2. **Email Verification**: Check console for mock email
3. **Sign In**: Login with credentials
4. **Remember Me**: Test persistent sessions
5. **Password Reset**: Test forgot password flow
6. **Profile Management**: Update user profile
7. **Chat Creation**: Start conversations
8. **Real-time Messaging**: Send and receive messages

## 🔄 Migration from Supabase

### What Changed

1. **Database**: Supabase → Neon PostgreSQL
2. **Auth**: Supabase Auth → Custom JWT
3. **Real-time**: Supabase Realtime → Polling (upgradeable)
4. **Storage**: Supabase Storage → Custom (to implement)
5. **API**: Supabase Client → Custom API calls

### Benefits

- **Full Control** over authentication logic
- **Cost Effective** with Neon's pricing
- **Customizable** authentication flows
- **No Vendor Lock-in** - standard PostgreSQL
- **Scalable** architecture

### Considerations

- **More Setup** required for production
- **Backend Development** needed
- **Real-time Features** need implementation
- **Email Service** integration required

## 🛠️ Customization

### Adding OAuth Providers

1. Implement OAuth flows in `utils/auth.ts`
2. Add provider-specific endpoints
3. Update UI components
4. Handle OAuth callbacks

### Real-time Messaging

1. Replace polling with WebSocket connection
2. Implement server-side WebSocket handling
3. Add connection management
4. Handle reconnection logic

### File Uploads

1. Add file upload endpoints
2. Implement storage service (AWS S3, etc.)
3. Update message types for media
4. Add file preview components

## 📚 Database Schema

### Core Tables

- **users** - Authentication and user data
- **profiles** - User profiles and settings
- **chats** - Chat rooms and metadata
- **chat_participants** - User-chat relationships
- **messages** - Chat messages
- **user_sessions** - JWT session management

### Key Features

- **UUID Primary Keys** for security
- **Automatic Timestamps** with triggers
- **Foreign Key Constraints** for data integrity
- **Indexes** for query performance
- **Functions** for complex operations

## 🔒 Security Checklist

- [ ] Strong JWT secrets in production
- [ ] HTTPS for all connections
- [ ] Input validation on all endpoints
- [ ] Rate limiting for auth endpoints
- [ ] Password strength requirements
- [ ] Email verification enforcement
- [ ] Session timeout configuration
- [ ] Database connection security
- [ ] Error message sanitization
- [ ] Audit logging for sensitive operations

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check Neon connection string
   - Verify database is running
   - Check network connectivity

2. **JWT Token Invalid**
   - Verify JWT secret configuration
   - Check token expiration
   - Clear stored sessions

3. **Authentication Not Working**
   - Check environment variables
   - Verify API endpoints
   - Test with mock data first

4. **Real-time Updates Slow**
   - Polling interval too high
   - Database query performance
   - Network latency issues

### Debug Mode

Enable debug logging:

```bash
EXPO_PUBLIC_DEBUG=true
```

This will show:
- Database queries
- Authentication attempts
- JWT token operations
- API call details

## 📈 Performance Optimization

### Database

- Use connection pooling
- Optimize query indexes
- Implement query caching
- Monitor slow queries

### Frontend

- Implement message pagination
- Use virtual scrolling for long chats
- Cache user profiles
- Optimize re-renders

### Real-time

- Implement WebSocket connections
- Use message queuing
- Add offline support
- Implement push notifications

This setup provides a solid foundation for a production-ready chat application with full control over the authentication and data layer.