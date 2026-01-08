#!/bin/bash

echo "============================================"
echo "Setting up Adaptive Learning System"
echo "============================================"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL not found"
    echo "Please add it to your .env file"
    exit 1
fi

echo "✓ DATABASE_URL found"
echo ""
echo "Step 2: Creating database tables..."
echo "This will create the following tables:"
echo "- learning_profiles"
echo "- skill_assessments"
echo "- personalized_exercises"
echo "- learning_milestones"
echo "- adaptive_feedback_history"
echo ""

read -p "Continue? (y/n): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Setup cancelled"
    exit 0
fi

echo ""
echo "Running SQL migrations..."
psql "$DATABASE_URL" -f scripts/create-adaptive-learning-tables.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================"
    echo "✓ Adaptive Learning System setup complete!"
    echo "============================================"
    echo ""
    echo "Next steps:"
    echo "1. Restart your development server"
    echo "2. Test endpoints at /api/adaptive-learning/dashboard"
    echo "3. Read ADAPTIVE_LEARNING_GUIDE.md for usage"
    echo ""
else
    echo ""
    echo "============================================"
    echo "✗ Setup failed"
    echo "============================================"
    echo ""
    echo "Troubleshooting:"
    echo "1. Verify DATABASE_URL is correct"
    echo "2. Check PostgreSQL connection"
    echo "3. Ensure you have CREATE TABLE permissions"
    echo ""
    exit 1
fi
