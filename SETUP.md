# TasksMint Setup Guide

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Node.js**: Version 18 or higher

## Supabase Setup

### 1. Create a New Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created (usually takes 2-3 minutes)

### 2. Get Your Project Credentials

1. Go to **Settings** → **API**
2. Copy your **Project URL** and **anon/public key**

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 4. Run Database Migrations

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the migrations in order:
   - First: Copy and run `supabase/migrations/create_auth_schema.sql`
   - Second: Copy and run `supabase/migrations/create_kanban_schema.sql`

### 5. Configure Authentication

#### Email Magic Links
1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add your domain (e.g., `http://localhost:5173` for development)
3. Under **Redirect URLs**, add `http://localhost:5173/auth/callback`

#### OAuth Providers (Optional)

**Google OAuth:**
1. Go to **Authentication** → **Providers**
2. Enable Google provider
3. Add your Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)

**Apple OAuth:**
1. Go to **Authentication** → **Providers**
2. Enable Apple provider
3. Add your Apple OAuth credentials from [Apple Developer](https://developer.apple.com/)

## Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:5173`

## Features

### Guest Mode
- Users start in guest mode automatically
- Data is stored locally in the browser
- No sign-up required to start using the app

### Authentication
- **Email Magic Links**: Passwordless authentication
- **Google OAuth**: Sign in with Google account
- **Apple OAuth**: Sign in with Apple ID
- **Guest Upgrade**: Seamlessly upgrade guest accounts to real accounts

### Sync & Offline
- **Real-time Sync**: Changes sync across devices instantly
- **Offline Support**: Works offline with local caching
- **Conflict Resolution**: Last-write-wins with user notifications

### Data Export
- Users can export their data as JSON
- Useful for backups or migration

## Security

- **Row Level Security (RLS)**: Users can only access their own data
- **Guest Data Isolation**: Guest data is isolated by unique IDs
- **Secure Transfers**: Guest data is securely transferred when upgrading accounts

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Make sure `.env` file exists and contains valid credentials
   - Restart the development server after updating `.env`

2. **Authentication not working**
   - Check that redirect URLs are configured correctly in Supabase
   - Ensure Site URL matches your development/production domain

3. **Database errors**
   - Verify that both migration files have been run successfully
   - Check the Supabase logs in the dashboard for detailed error messages

4. **OAuth not working**
   - Ensure OAuth providers are properly configured in Supabase
   - Check that OAuth app credentials are correct and active

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Visit the [Supabase Community](https://github.com/supabase/supabase/discussions)
- Review the browser console for error messages

## Production Deployment

1. **Update Environment Variables**:
   - Set production Supabase URL and keys
   - Update Site URL and Redirect URLs in Supabase settings

2. **Build the Application**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   - Deploy the `dist` folder to your hosting provider
   - Popular options: Vercel, Netlify, Cloudflare Pages

## License

MIT License - see LICENSE file for details.