-- Migration script for project submissions table
-- This script safely creates the table and columns if they don't exist

-- Create project_submissions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'project_submissions'
    ) THEN
        CREATE TABLE project_submissions (
            id SERIAL PRIMARY KEY,
            team_name VARCHAR(255) NOT NULL,
            project_name VARCHAR(255) NOT NULL,
            project_description TEXT NOT NULL,
            github_link VARCHAR(500) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create index on team_name for faster queries if it doesn't exist
        CREATE INDEX IF NOT EXISTS idx_team_name ON project_submissions(team_name);
        
        RAISE NOTICE 'Table project_submissions created successfully';
    ELSE
        RAISE NOTICE 'Table project_submissions already exists';
    END IF;
END $$;

-- Add columns if they don't exist (for future migrations)
DO $$
BEGIN
    -- Check and add team_name column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_submissions' 
        AND column_name = 'team_name'
    ) THEN
        ALTER TABLE project_submissions ADD COLUMN team_name VARCHAR(255) NOT NULL;
        RAISE NOTICE 'Column team_name added';
    END IF;

    -- Check and add project_name column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_submissions' 
        AND column_name = 'project_name'
    ) THEN
        ALTER TABLE project_submissions ADD COLUMN project_name VARCHAR(255) NOT NULL;
        RAISE NOTICE 'Column project_name added';
    END IF;

    -- Check and add project_description column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_submissions' 
        AND column_name = 'project_description'
    ) THEN
        ALTER TABLE project_submissions ADD COLUMN project_description TEXT NOT NULL;
        RAISE NOTICE 'Column project_description added';
    END IF;

    -- Check and add github_link column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_submissions' 
        AND column_name = 'github_link'
    ) THEN
        ALTER TABLE project_submissions ADD COLUMN github_link VARCHAR(500) NOT NULL;
        RAISE NOTICE 'Column github_link added';
    END IF;

    -- Check and add created_at column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_submissions' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE project_submissions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Column created_at added';
    END IF;

    -- Check and add updated_at column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_submissions' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE project_submissions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Column updated_at added';
    END IF;
END $$;

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'update_project_submissions_updated_at'
    ) THEN
        CREATE TRIGGER update_project_submissions_updated_at
        BEFORE UPDATE ON project_submissions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger created successfully';
    END IF;
END $$;
