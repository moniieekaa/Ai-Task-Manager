-- Insert sample users (passwords are hashed for 'password123')
INSERT INTO users (name, email, password_hash) VALUES
('John Doe', 'john@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm'),
('Jane Smith', 'jane@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm')
ON CONFLICT (email) DO NOTHING;

-- Get user IDs for sample data
DO $$
DECLARE
    john_id UUID;
    jane_id UUID;
BEGIN
    SELECT id INTO john_id FROM users WHERE email = 'john@example.com';
    SELECT id INTO jane_id FROM users WHERE email = 'jane@example.com';
    
    -- Insert sample tasks for John
    INSERT INTO tasks (title, description, category, completed, user_id) VALUES
    ('Learn React fundamentals', 'Complete the official React tutorial and build a simple app', 'learning', false, john_id),
    ('Set up development environment', 'Install Node.js, VS Code, and configure Git', 'learning', true, john_id),
    ('Build a portfolio website', 'Create a personal website showcasing projects and skills', 'work', false, john_id),
    ('Exercise for 30 minutes', 'Go for a run or do a home workout', 'health', true, john_id),
    ('Read 20 pages of a book', 'Continue reading "Clean Code" by Robert Martin', 'personal', false, john_id);
    
    -- Insert sample tasks for Jane
    INSERT INTO tasks (title, description, category, completed, user_id) VALUES
    ('Plan weekly meals', 'Create a meal plan for the upcoming week', 'personal', true, jane_id),
    ('Review quarterly budget', 'Analyze expenses and adjust budget for next quarter', 'finance', false, jane_id),
    ('Complete Python course', 'Finish the advanced Python course on data structures', 'learning', false, jane_id),
    ('Team meeting preparation', 'Prepare slides and agenda for Monday team meeting', 'work', true, jane_id),
    ('Yoga session', 'Attend the evening yoga class at the local studio', 'health', false, jane_id);
END $$;
