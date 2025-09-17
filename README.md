# WhatsApp Clone - React Native with Neon Database

A WhatsApp-like chat application built with React Native, Expo, and Neon PostgreSQL with custom JWT authentication.

## Features

### 🔐 **Enhanced Authentication System**
- **Email/Password Authentication** with real-time validation
- **Social Login** (Google & Apple Sign In)
- **Password Reset** with email verification
- **Remember Me** functionality with persistent sessions
- **Email Verification** for new accounts
- **Secure Session Management** with auto-refresh

### 💬 **Real-time Chat Features**
- **Instant Messaging** with live updates
- **Direct Messages** between users
- **Message History** with sender information
- **Real-time Subscriptions** for live chat updates
- **Online Status** and last seen indicators

### 📱 **User Experience**
- **WhatsApp-inspired UI** with modern design
- **User Profile Management** (username, display name, avatar)
- **Input Validation** with helpful error messages
- **Loading States** and smooth transitions
- **Cross-platform Support** (iOS, Android, Web)

## Tech Stack

- **Frontend**: React Native with Expo
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Custom JWT-based system
- **Navigation**: React Navigation
- **State Management**: React Hooks
- **UI**: React Native components with custom styling
- **Real-time**: Polling-based updates (upgradeable to WebSocket)

## Setup Instructions

### 1. Neon Database Setup

1. Create a new project at [neon.tech](https://neon.tech)
2. Copy your database connection string
3. Run the SQL schema from `neon-schema.sql` in the Neon SQL console
4. Create a `.env.local` file with your credentials:

```bash
EXPO_PUBLIC_DATABASE_URL=postgresql://username:password@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require
EXPO_PUBLIC_JWT_SECRET=your-super-secret-jwt-key
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

5. Update `app.json` with your configuration in the `extra` section

**📖 For detailed setup instructions, see [NEON_SETUP.md](./NEON_SETUP.md)**

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the App

```bash
# Web (for development)
npm run web

# iOS (requires macOS)
npm run ios

# Android
npm run android
```

## Database Schema

The app uses the following main tables:

- **users**: Authentication and user account data
- **profiles**: User information (username, full_name, avatar_url)
- **chats**: Chat rooms (name, is_group, last_message)
- **chat_participants**: Many-to-many relationship between users and chats
- **messages**: Chat messages with polling-based updates
- **user_sessions**: JWT session management

## Key Features Implementation

### Real-time Messaging
- Uses polling for message updates (upgradeable to WebSocket)
- Automatic chat list updates when new messages arrive
- Optimistic UI updates for smooth experience

### Authentication Flow
- Custom JWT-based authentication system
- Email/password with secure password hashing
- Automatic profile creation on signup
- Persistent session management with AsyncStorage

### Chat Management
- Direct message creation between users
- Chat list with last message preview
- Message history with sender information

## Project Structure

```
├── utils/
│   ├── database.ts          # Neon database client and operations
│   ├── auth.ts              # Custom authentication API
│   └── jwt.ts               # JWT utilities and password hashing
├── lib/
│   └── supabase.ts          # Backward compatibility exports
├── hooks/
│   ├── useAuth.ts           # Enhanced authentication with social login
│   ├── useChats.ts          # Chat management
│   └── useMessages.ts       # Message handling
├── screens/
│   ├── LoginScreen.tsx      # Enhanced login with validation
│   ├── SignUpScreen.tsx     # Registration interface
│   ├── ForgotPasswordScreen.tsx    # Password reset flow
│   ├── EmailVerificationScreen.tsx # Email verification
│   ├── ChatListScreen.tsx   # Main chat list
│   ├── ChatScreen.tsx       # Individual chat view
│   ├── NewChatScreen.tsx    # User selection for new chats
│   └── ProfileScreen.tsx    # User profile management
├── components/
│   └── SocialLoginButtons.tsx # Reusable social auth buttons
├── navigation/
│   └── AppNavigator.tsx     # Navigation setup
├── .env.local               # Environment configuration
├── neon-schema.sql          # Neon database schema
├── supabase-schema.sql      # Legacy Supabase schema
├── NEON_SETUP.md            # Detailed Neon setup guide
└── AUTHENTICATION_SETUP.md  # Legacy auth setup guide
```

## Usage

1. **Sign Up**: Create a new account with email and password
2. **Profile Setup**: Set your username and display name
3. **Start Chatting**: Find users and start conversations
4. **Real-time Messages**: Send and receive messages instantly

## Security Features

### Database Security
- Foreign key constraints for data integrity
- Input validation and parameterized queries
- Secure password hashing
- Session management with expiration

### Authentication Security
- JWT token-based authentication
- Secure session storage with AsyncStorage
- Automatic token refresh
- Proper session cleanup on logout

### Input Validation
- Email format validation
- Password strength requirements
- Username validation
- XSS protection through sanitization

## Customization

The app is designed to be easily customizable:

- **Styling**: Modify styles in each component
- **Features**: Add group chats, media sharing, etc.
- **Database**: Extend schema for additional features
- **UI**: Customize colors, fonts, and layouts

## Demo

The app is currently running at: [Preview URL](https://8081--01995969-16ef-72c5-a204-0f7f23f520fc.eu-central-1-01.gitpod.dev)

**Note**: You'll need to set up your own Neon database and update the configuration to use the app with real data. See [NEON_SETUP.md](./NEON_SETUP.md) for detailed instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project as a starting point for your own chat applications.