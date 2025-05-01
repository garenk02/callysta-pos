# Database Setup and Security

This directory contains SQL files for setting up the database schema and security policies.

## Row Level Security (RLS) Policies

The `rls_policies.sql` file contains Row Level Security policies for the `profiles` table. These policies ensure that:

1. Regular users can only read and update their own profiles
2. Regular users cannot change their role
3. Admins can read, insert, update, and delete any profile

### How to Apply RLS Policies

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy the contents of `rls_policies.sql`
4. Paste into the SQL Editor
5. Run the SQL commands

## Database Schema

The application requires the following tables:

### profiles

This table stores user profile information and is linked to Supabase Auth users.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cashier')),
  is_active BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the email column for faster lookups
CREATE INDEX profiles_email_idx ON profiles(email);
```

If this table doesn't exist yet, you can create it by running the SQL above in the Supabase SQL Editor.
