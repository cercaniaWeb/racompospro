// Simple test to verify all POS components can be imported correctly
import { db } from './src/lib/db';
import { useScale } from './src/hooks/useScale';
import Terminal from './src/components/pos/Terminal';
// import { getSyncService } from './src/services/sync'; // OLD API - no longer exists

console.log('All POS components imported successfully!');
console.log('Database instance created:', !!db);
// console.log('Sync service can be created:', !!getSyncService); // OLD API
console.log('Terminal component exists:', !!Terminal);
console.log('Scale hook exists:', !!useScale);

// Test basic database functionality
async function testDatabase() {
  try {
    // Try to access the database instance
    console.log('Database name:', db.name);
    console.log('Database tables:', Object.keys(db));

    // The database will be initialized when first accessed
    console.log('Database ready for use');
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

// Run the database test
testDatabase();