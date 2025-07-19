/*
  # MrSplit Database Schema

  1. New Tables
    - `users` - User profiles and authentication data
    - `groups` - Expense groups with metadata
    - `group_members` - Many-to-many relationship between users and groups
    - `expenses` - Individual expense records
    - `splits` - How expenses are split among group members
    - `settlements` - Records of debt payments
    - `notifications` - In-app notification system

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Group-based access control for expenses and splits

  3. Features
    - Role-based permissions (admin/member)
    - Multi-currency support
    - Receipt photo storage
    - Audit logging for transparency
*/

-- Users table for storing profile information
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Groups table for expense groups
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_url text,
  invite_code text UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Group membership with roles
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Expenses within groups
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  amount decimal(10, 2) NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'USD',
  payer_id uuid REFERENCES users(id) NOT NULL,
  description text,
  receipt_url text,
  expense_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) NOT NULL
);

-- How expenses are split among members
CREATE TABLE IF NOT EXISTS splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  share_amount decimal(10, 2) NOT NULL CHECK (share_amount >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(expense_id, user_id)
);

-- Settlement records
CREATE TABLE IF NOT EXISTS settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid REFERENCES users(id) NOT NULL,
  to_user uuid REFERENCES users(id) NOT NULL,
  amount decimal(10, 2) NOT NULL CHECK (amount > 0),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  CHECK (from_user != to_user)
);

-- Notifications system
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('expense_added', 'group_invite', 'settlement_request', 'payment_received')) NOT NULL,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "Users can manage own profile" ON users
  FOR ALL USING (auth.uid() = id);

-- Group policies
CREATE POLICY "Users can read groups they belong to" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Group members policies
CREATE POLICY "Users can read group memberships" ON group_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM group_members gm2 
      WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can manage members" ON group_members
  FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Expenses policies
CREATE POLICY "Group members can manage expenses" ON expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = expenses.group_id AND user_id = auth.uid()
    )
  );

-- Splits policies
CREATE POLICY "Group members can view splits" ON splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM expenses e
      JOIN group_members gm ON e.group_id = gm.group_id
      WHERE e.id = splits.expense_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage splits" ON splits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses e
      JOIN group_members gm ON e.group_id = gm.group_id
      WHERE e.id = splits.expense_id AND gm.user_id = auth.uid()
    )
  );

-- Settlements policies
CREATE POLICY "Group members can view settlements" ON settlements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = settlements.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create settlements" ON settlements
  FOR INSERT WITH CHECK (
    (from_user = auth.uid() OR to_user = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = settlements.group_id AND user_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payer_id ON expenses(payer_id);
CREATE INDEX IF NOT EXISTS idx_splits_expense_id ON splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_splits_user_id ON splits(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group_id ON settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, read);