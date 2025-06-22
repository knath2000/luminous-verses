# Better Auth Setup Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Better Auth Configuration
BETTER_AUTH_SECRET="your-super-secret-jwt-secret-key-here-make-it-long-and-random"
BETTER_AUTH_URL="http://localhost:3000"

# Database (using your existing Neon database)
DATABASE_URL="your-neon-postgres-connection-string"

# OAuth Providers (get these from Google and GitHub developer consoles)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id" 
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
```

## OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create credentials (OAuth 2.0 Client ID)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://luminous-verses.vercel.app/api/auth/callback/google` (production)

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github` (development)
   - `https://luminous-verses.vercel.app/api/auth/callback/github` (production)

## Database Setup

Better Auth will automatically create the necessary tables in your existing Neon database. The tables created will be:
- `user` - User accounts
- `session` - User sessions  
- `account` - OAuth accounts linked to users
- `verification` - Email verification tokens

## Migration from Stack Auth

Your existing user data will be preserved. Better Auth can work alongside your current user tables. To migrate users from Stack Auth to Better Auth:

1. The new auth system will create its own user table
2. You can create a migration script to copy existing users
3. Or implement a "progressive migration" where users are migrated on their next login

## React Native Configuration

Make sure your `app.json` includes the correct scheme:

```json
{
  "expo": {
    "scheme": "luminous-verses"
  }
}
```

## Production Deployment

For production on Vercel, add these environment variables in your Vercel dashboard:
- All the same variables from `.env.local`
- Update `BETTER_AUTH_URL` to your production domain
- Update `NEXTAUTH_URL` to your production domain 