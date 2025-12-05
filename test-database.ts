import { db } from './src/lib/db';

async function testDatabase() {
  console.log('Testing database connection...');
  
  try {
    // Try to access the database
    console.log('Database name:', db.name);
    console.log('Database version:', db.verno);
    
    // Check if products table is accessible
    const productCount = await db.products.count();
    console.log('Total products in database:', productCount);
    
    if (productCount > 0) {
      // Get first few products to check their structure
      const sampleProducts = await db.products.limit(5).toArray();
      console.log('Sample products:', sampleProducts);
      
      // Check active products
      const allProducts = await db.products.toArray();
      const activeProducts = allProducts.filter(p => p.is_active);
      console.log('Active products:', activeProducts.length);
    } else {
      console.log('No products found in database');
      console.log('This could mean either:');
      console.log('1. Database is empty');
      console.log('2. Sync has not been run to populate the database');
      console.log('3. There was an issue during sync initialization');
    }
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

// Run the test
testDatabase();