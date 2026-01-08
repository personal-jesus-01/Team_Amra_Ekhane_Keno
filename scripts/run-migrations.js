/**
 * Database Migration Runner
 * Runs adaptive learning table migrations using Node.js
 */

const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  console.log('============================================');
  console.log('Running Database Migrations');
  console.log('============================================\n');

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL not found in environment');
    console.error('Please check your .env file');
    process.exit(1);
  }

  console.log('✓ DATABASE_URL found');
  console.log(`  Database: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'NeonDB'}\n`);

  // Create connection pool
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Test connection
    console.log('Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✓ Database connection successful\n');

    // Read migration SQL
    console.log('Reading migration file...');
    const sqlPath = path.join(__dirname, 'create-adaptive-learning-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('✓ Migration file loaded\n');

    // Run migration
    console.log('Creating tables...');
    console.log('  - learning_profiles');
    console.log('  - skill_assessments');
    console.log('  - personalized_exercises');
    console.log('  - learning_milestones');
    console.log('  - adaptive_feedback_history\n');

    await pool.query(sql);

    console.log('✓ All tables created successfully\n');

    // Verify tables exist
    console.log('Verifying tables...');
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'learning_profiles',
        'skill_assessments',
        'personalized_exercises',
        'learning_milestones',
        'adaptive_feedback_history'
      )
      ORDER BY table_name
    `);

    console.log(`✓ Found ${result.rows.length} new tables:`);
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n============================================');
    console.log('✓ Migration Complete!');
    console.log('============================================\n');
    console.log('Your adaptive learning system is ready.');
    console.log('Start your server with: npm run dev\n');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('\n============================================');
      console.log('✓ Tables Already Exist');
      console.log('============================================\n');
      console.log('The adaptive learning tables have already been created.');
      console.log('Your database is ready to use.\n');
    } else {
      console.error('\n============================================');
      console.error('✗ Migration Failed');
      console.error('============================================\n');
      console.error('Error:', error.message);
      console.error('\nFull error:', error);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
