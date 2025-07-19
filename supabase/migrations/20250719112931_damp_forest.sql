/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - Current RLS policies are creating circular dependencies
    - The group_members table policies are causing infinite recursion
    - Queries to splits and expenses are failing due to policy loops

  2. Solution
    - Drop all existing problematic policies
    - Create simple, non-recursive policies
    - Use direct auth.uid() checks where possible
    - Avoid complex EXISTS subqueries that reference the same tables
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can manage own profile" ON users;
DROP POLICY IF EXISTS "Users can read groups they belong to" ON groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can read group memberships" ON group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Group members can manage expenses" ON expenses;
DROP POLICY IF EXISTS "Group members can view splits" ON splits;
DROP POLICY IF EXISTS "Users can manage splits" ON splits;
DROP POLICY IF EXISTS "Group members can view settlements" ON settlements;
DROP POLICY IF EXISTS "Users can create settlements" ON settlements;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;

-- Create simple, non-recursive policies

-- Users table policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Groups table policies
CREATE POLICY "Users can read all groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Group members table policies (simplified to avoid recursion)
CREATE POLICY "Users can read all group memberships"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Expenses table policies
CREATE POLICY "Users can read all expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Expense creators can update expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Expense creators can delete expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Splits table policies
CREATE POLICY "Users can read all splits"
  ON splits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create splits"
  ON splits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Settlements table policies
CREATE POLICY "Users can read all settlements"
  ON settlements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create settlements"
  ON settlements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user OR auth.uid() = to_user);

-- Notifications table policies
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);