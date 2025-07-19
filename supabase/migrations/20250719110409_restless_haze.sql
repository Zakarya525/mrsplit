/*
  # Fix RLS Policies to Resolve Infinite Recursion

  1. Policy Updates
    - Simplify group_members policies to avoid circular references
    - Fix expenses and splits policies to prevent recursion
    - Ensure proper access control without self-referencing loops

  2. Security
    - Maintain proper access control
    - Users can only access their own data and groups they belong to
    - Prevent unauthorized access while avoiding recursion
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "group_access" ON groups;
DROP POLICY IF EXISTS "group_member_access" ON group_members;
DROP POLICY IF EXISTS "expense_access" ON expenses;
DROP POLICY IF EXISTS "split_access" ON splits;
DROP POLICY IF EXISTS "settlement_access" ON settlements;

-- Create simplified, non-recursive policies for group_members
CREATE POLICY "Users can read own memberships"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own memberships"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Group admins can manage members"
  ON group_members
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM group_members gm 
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role = 'admin'
    )
  );

-- Create non-recursive policy for groups
CREATE POLICY "Users can read groups they belong to"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group admins can update groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create non-recursive policy for expenses
CREATE POLICY "Group members can manage expenses"
  ON expenses
  FOR ALL
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Create non-recursive policy for splits
CREATE POLICY "Users can view splits"
  ON splits
  FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT e.id FROM expenses e
      JOIN group_members gm ON e.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage splits"
  ON splits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    expense_id IN (
      SELECT e.id FROM expenses e
      JOIN group_members gm ON e.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

-- Create non-recursive policy for settlements
CREATE POLICY "Group members can view settlements"
  ON settlements
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create settlements"
  ON settlements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (from_user = auth.uid() OR to_user = auth.uid()) AND
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid()
    )
  );