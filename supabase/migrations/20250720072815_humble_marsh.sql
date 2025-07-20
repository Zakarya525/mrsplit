/*
  # Fix Authentication and RLS Policies

  1. Drop all existing policies to start fresh
  2. Create simple, non-recursive policies
  3. Ensure proper user authentication flow
  4. Fix data access patterns
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can read all groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update groups" ON groups;
DROP POLICY IF EXISTS "Users can read all group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Users can read all expenses" ON expenses;
DROP POLICY IF EXISTS "Users can create expenses" ON expenses;
DROP POLICY IF EXISTS "Expense creators can update expenses" ON expenses;
DROP POLICY IF EXISTS "Expense creators can delete expenses" ON expenses;
DROP POLICY IF EXISTS "Users can read all splits" ON splits;
DROP POLICY IF EXISTS "Users can create splits" ON splits;
DROP POLICY IF EXISTS "Users can read all settlements" ON settlements;
DROP POLICY IF EXISTS "Users can create settlements" ON settlements;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Users table policies
CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Groups table policies
CREATE POLICY "Enable read access for all authenticated users" ON groups
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON groups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update for group creators" ON groups
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Group members table policies
CREATE POLICY "Enable read access for all authenticated users" ON group_members
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON group_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for own membership" ON group_members
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Expenses table policies
CREATE POLICY "Enable read access for all authenticated users" ON expenses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON expenses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update for expense creators" ON expenses
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable delete for expense creators" ON expenses
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Splits table policies
CREATE POLICY "Enable read access for all authenticated users" ON splits
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON splits
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Settlements table policies
CREATE POLICY "Enable read access for all authenticated users" ON settlements
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON settlements
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user OR auth.uid() = to_user);

-- Notifications table policies
CREATE POLICY "Enable read access for own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);