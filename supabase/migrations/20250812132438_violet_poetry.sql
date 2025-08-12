/*
  # Kanban Board Schema

  1. New Tables
    - `boards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `title` (text)
      - `description` (text, nullable)
      - `color` (text, default '#6366f1')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `version` (integer, for conflict resolution)

    - `lists`
      - `id` (uuid, primary key)
      - `board_id` (uuid, references boards)
      - `user_id` (uuid, references user_profiles)
      - `title` (text)
      - `position` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `version` (integer)

    - `tasks`
      - `id` (uuid, primary key)
      - `list_id` (uuid, references lists)
      - `user_id` (uuid, references user_profiles)
      - `title` (text)
      - `description` (text, nullable)
      - `completed` (boolean, default false)
      - `priority` (enum: low, medium, high)
      - `labels` (text array)
      - `position` (integer)
      - `due_date` (timestamp, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `version` (integer)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data
    - Add indexes for performance

  3. Functions
    - Function to transfer guest data to authenticated user
*/

-- Create priority enum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

-- Create boards table
CREATE TABLE IF NOT EXISTS boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  version integer DEFAULT 1
);

-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  version integer DEFAULT 1
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  completed boolean DEFAULT false,
  priority task_priority DEFAULT 'medium',
  labels text[] DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  version integer DEFAULT 1
);

-- Enable RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Boards policies
CREATE POLICY "Users can view own boards"
  ON boards FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create own boards"
  ON boards FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own boards"
  ON boards FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own boards"
  ON boards FOR DELETE
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Lists policies
CREATE POLICY "Users can view own lists"
  ON lists FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create own lists"
  ON lists FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own lists"
  ON lists FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own lists"
  ON lists FOR DELETE
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Tasks policies
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS boards_user_id_idx ON boards(user_id);
CREATE INDEX IF NOT EXISTS boards_created_at_idx ON boards(created_at);

CREATE INDEX IF NOT EXISTS lists_board_id_idx ON lists(board_id);
CREATE INDEX IF NOT EXISTS lists_user_id_idx ON lists(user_id);
CREATE INDEX IF NOT EXISTS lists_position_idx ON lists(position);

CREATE INDEX IF NOT EXISTS tasks_list_id_idx ON tasks(list_id);
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_position_idx ON tasks(position);
CREATE INDEX IF NOT EXISTS tasks_completed_idx ON tasks(completed);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);

-- Add updated_at triggers
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to transfer guest data to authenticated user
CREATE OR REPLACE FUNCTION transfer_guest_data(guest_id uuid, new_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Transfer boards
  UPDATE boards 
  SET user_id = new_user_id 
  WHERE user_id = guest_id;
  
  -- Transfer lists
  UPDATE lists 
  SET user_id = new_user_id 
  WHERE user_id = guest_id;
  
  -- Transfer tasks
  UPDATE tasks 
  SET user_id = new_user_id 
  WHERE user_id = guest_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;