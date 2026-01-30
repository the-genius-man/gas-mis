-- Check the structure of affectations_roteur table
PRAGMA table_info(affectations_roteur);

-- Show all columns and their types
SELECT sql FROM sqlite_master WHERE type='table' AND name='affectations_roteur';

-- Show current data in the table
SELECT * FROM affectations_roteur LIMIT 5;