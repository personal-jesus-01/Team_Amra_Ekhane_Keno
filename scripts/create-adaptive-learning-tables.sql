-- ============================================
-- ADAPTIVE LEARNING SYSTEM - DATABASE MIGRATIONS
-- ============================================
-- This script creates all tables needed for the adaptive learning system
-- Run this against your NeonDB database

-- Learning Profiles Table
CREATE TABLE IF NOT EXISTS learning_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_level TEXT DEFAULT 'beginner',
    learning_pace TEXT DEFAULT 'moderate',
    strong_areas TEXT,
    weak_areas TEXT,
    preferred_language TEXT DEFAULT 'english',
    total_practice_time INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_practice_date TIMESTAMP,
    adaptive_difficulty INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skill Assessments Table
CREATE TABLE IF NOT EXISTS skill_assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_category TEXT NOT NULL,
    proficiency_level INTEGER NOT NULL,
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id INTEGER REFERENCES coach_sessions(id) ON DELETE SET NULL,
    trend TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personalized Exercises Table
CREATE TABLE IF NOT EXISTS personalized_exercises (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_type TEXT NOT NULL,
    difficulty_level INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT NOT NULL,
    target_skills TEXT,
    estimated_duration INTEGER,
    is_completed INTEGER DEFAULT 0,
    completion_date TIMESTAMP,
    ai_generated INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning Milestones Table
CREATE TABLE IF NOT EXISTS learning_milestones (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points_earned INTEGER DEFAULT 0
);

-- Adaptive Feedback History Table
CREATE TABLE IF NOT EXISTS adaptive_feedback_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES coach_sessions(id) ON DELETE CASCADE,
    feedback_strategy TEXT NOT NULL,
    difficulty_adjustment TEXT,
    new_difficulty_level INTEGER,
    ai_rationale TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_profiles_user_id ON learning_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_user_id ON skill_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_session_id ON skill_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_personalized_exercises_user_id ON personalized_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_milestones_user_id ON learning_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_feedback_user_id ON adaptive_feedback_history(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_feedback_session_id ON adaptive_feedback_history(session_id);

-- Comments for documentation
COMMENT ON TABLE learning_profiles IS 'Stores user learning profiles for adaptive learning system';
COMMENT ON TABLE skill_assessments IS 'Tracks skill proficiency levels over time';
COMMENT ON TABLE personalized_exercises IS 'AI-generated personalized practice exercises';
COMMENT ON TABLE learning_milestones IS 'User achievements and milestones';
COMMENT ON TABLE adaptive_feedback_history IS 'History of AI coaching decisions';
