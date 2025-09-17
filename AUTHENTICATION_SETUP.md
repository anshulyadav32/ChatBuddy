# Enhanced Authentication Setup Guide

This guide covers the complete setup for the enhanced authentication system with social login, password reset, and persistent sessions.

## 🔧 Environment Configuration

### 1. Create `.env.local` file

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Custom redirect URLs
EXPO_PUBLIC_SITE_URL=https://your-app.com
EXPO_PUBLIC_ENVIRONMENT=development
```

### 2. Update `app.json`

Replace the placeholder values in `app.json`:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project.supabase.co",
      "supabaseAnonKey": "your-anon-key-here"
    }
  }
}
```

## 🗄️ Database Setup

### 1. Run the Enhanced Schema

Execute this SQL in your Supabase SQL editor:

```sql
-- Enhanced profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- Enhanced chat_participants table
ALTER TABLE chat_participants ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

-- Enhanced messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id);
ALTER TABLE messages ALTER COLUMN message_type TYPE TEXT;
ALTER TABLE messages ADD CONSTRAINT message_type_check 
  CHECK (message_type IN ('text', 'image', 'file', 'audio'));

-- Enhanced chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Function to update user online status
CREATE OR REPLACE FUNCTION update_user_online_status(user_id UUID, is_online BOOLEAN)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET 
    is_online = update_user_online_status.is_online,
    last_seen = CASE 
      WHEN update_user_online_status.is_online = FALSE THEN NOW() 
      ELSE last_seen 
    END,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Configure Authentication Settings

In your Supabase dashboard:

1. **Go to Authentication > Settings**
2. **Enable Email Confirmations**: Turn on "Enable email confirmations"
3. **Set Site URL**: Add your app's URL (for redirects)
4. **Configure Email Templates**: Customize signup and reset password emails

### 3. Set Up OAuth Providers (Optional)

#### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
6. In Supabase: Authentication > Providers > Google
7. Enable and add your Client ID and Secret

#### Apple OAuth:
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Create a new App ID and Service ID
3. Configure Sign in with Apple
4. In Supabase: Authentication > Providers > Apple
5. Add your Service ID and Key

## 📱 Features Overview

### ✅ Enhanced Login System

- **Email/Password Authentication**
- **Input Validation**: Real-time email and password validation
- **Remember Me**: Persistent login sessions
- **Show/Hide Password**: Toggle password visibility
- **Error Handling**: Detailed error messages for different scenarios

### ✅ Password Reset Flow

- **Forgot Password**: Send reset email
- **Email Verification**: Handle email confirmation
- **Success Feedback**: Clear user feedback

### ✅ Social Authentication

- **Google Sign In**: OAuth integration
- **Apple Sign In**: iOS-specific authentication
- **Unified UI**: Consistent social login buttons

### ✅ Session Management

- **Persistent Sessions**: Remember user login
- **Auto Refresh**: Automatic token refresh
- **Secure Storage**: AsyncStorage for session data
- **Clean Logout**: Proper session cleanup

## 🔐 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:

- Users can only access their own data
- Chat participants can only see their chats
- Messages are filtered by chat membership

### Input Validation
- Email format validation
- Password strength requirements
- XSS protection through parameterized queries

### Session Security
- Automatic token refresh
- Secure storage of credentials
- Proper session cleanup on logout

## 🧪 Testing the Authentication Flow

### 1. Sign Up Flow
```
1. Open app → Login Screen
2. Tap "Sign Up" → Registration form
3. Fill valid details → Submit
4. Check email → Verify account
5. Return to app → Login with credentials
```

### 2. Login Flow
```
1. Enter email/password
2. Toggle "Remember Me"
3. Tap "Sign In"
4. Verify persistent session (close/reopen app)
```

### 3. Password Reset Flow
```
1. Tap "Forgot Password"
2. Enter email → Submit
3. Check email → Follow reset link
4. Set new password
5. Login with new credentials
```

### 4. Social Login Flow
```
1. Tap "Continue with Google/Apple"
2. Complete OAuth flow
3. Verify account creation
4. Test persistent session
```

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid API key"**
   - Check `.env.local` file exists
   - Verify Supabase URL and key are correct
   - Restart development server

2. **"Database not set up"**
   - Run the SQL schema in Supabase
   - Check table permissions
   - Verify RLS policies

3. **Social login not working**
   - Check OAuth provider configuration
   - Verify redirect URLs
   - Test in production environment

4. **Email not sending**
   - Check Supabase email settings
   - Verify SMTP configuration
   - Check spam folder

### Debug Mode:

Enable debug logging by adding to your `.env.local`:

```bash
EXPO_PUBLIC_DEBUG=true
```

## 📚 API Reference

### useAuth Hook

```typescript
const {
  session,           // Current user session
  user,             // Current user object
  loading,          // Loading state
  signUp,           // Register new user
  signIn,           // Login user
  signOut,          // Logout user
  resetPassword,    // Send reset email
  updatePassword,   // Update user password
  signInWithGoogle, // Google OAuth
  signInWithApple,  // Apple OAuth
  getStoredEmail,   // Get remembered email
  isRememberMeEnabled // Check remember me status
} = useAuth();
```

### Database Helpers

```typescript
import { dbHelpers } from './utils/supabase';

// Get user profile
const profile = await dbHelpers.getProfile(userId);

// Update profile
const updated = await dbHelpers.updateProfile(userId, { username: 'new' });

// Get user chats
const chats = await dbHelpers.getUserChats(userId);

// Send message
const message = await dbHelpers.sendMessage(chatId, userId, content);
```

## 🔄 Updates and Maintenance

### Regular Tasks:
- Monitor authentication metrics in Supabase
- Update OAuth credentials before expiry
- Review and update security policies
- Test authentication flow after updates

### Security Checklist:
- [ ] RLS enabled on all tables
- [ ] OAuth providers properly configured
- [ ] Email verification enabled
- [ ] Strong password requirements
- [ ] Session timeout configured
- [ ] Rate limiting enabled

This enhanced authentication system provides a robust, secure, and user-friendly login experience for your chat application.