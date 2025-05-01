-- Enable Row Level Security on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to read their own profile
CREATE POLICY "Users can read their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Create a policy that allows users to update their own profile
-- but they cannot change their role
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent users from changing their own role
  (role IS NULL OR role = (SELECT role FROM profiles WHERE id = auth.uid()))
);

-- Create a policy that allows admins to read all profiles
CREATE POLICY "Admins can read all profiles"
ON profiles
FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Create a policy that allows admins to insert new profiles
CREATE POLICY "Admins can insert profiles"
ON profiles
FOR INSERT
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Create a policy that allows admins to update any profile
CREATE POLICY "Admins can update any profile"
ON profiles
FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Create a policy that allows admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON profiles
FOR DELETE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
