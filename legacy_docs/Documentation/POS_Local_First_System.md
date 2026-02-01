# Local-First POS System

This is a Point of Sale (POS) system built with a Local-First architecture using Next.js, Dexie (IndexedDB), and Supabase for synchronization. The system provides offline capabilities, scale integration, and background synchronization.

## Features

- **Offline-First**: Full functionality available without internet connection
- **Scale Integration**: Connects to digital scales via hardware interfaces
- **Real-time Synchronization**: Background sync with Supabase when online
- **POS Terminal Interface**: Intuitive cashier interface with product search and cart management
- **Local Database**: Fast local queries using IndexedDB via Dexie

## Architecture

The system consists of four core components:

1. **Database Layer** (`src/lib/db.ts`): Local IndexedDB implementation with Dexie
2. **Scale Integration** (`src/hooks/useScale.ts`): Hardware scale connection hook
3. **POS Interface** (`src/components/pos/Terminal.tsx`): User-facing terminal interface
4. **Sync Service** (`src/services/sync.ts`): Background synchronization with Supabase

## Setup

1. Install dependencies:
```bash
npm install dexie @supabase/supabase-js date-fns
```

2. Configure environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Initialize the database and sync service in your application

## Usage

### Starting the POS Terminal

The POS terminal can be used as a standalone component:

```jsx
import Terminal from '@/components/pos/Terminal';

function App() {
  return (
    <div className="app">
      <Terminal />
    </div>
  );
}
```

### Scale Integration

The system includes a `useScale` hook that handles communication with digital scales:

```ts
import { useScale } from '@/hooks/useScale';

const { reading, isConnected, connect, disconnect, tare } = useScale({
  pollingInterval: 500,
  stabilityThreshold: 0.5,
  stabilityTime: 1000,
});
```

### Database Operations

The local database provides methods for all POS operations:

```ts
import { db } from '@/lib/db';

// Add a product
await db.products.add(productData);

// Get all active products
const products = await db.products.where('is_active').equals(true).toArray();

// Create a sale
const saleId = await db.sales.add(saleData);
```

### Synchronization

The sync service handles background synchronization:

```ts
import { getSyncService } from '@/services/sync';

const syncService = getSyncService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
  syncInterval: 30000, // Sync every 30 seconds
});

// Initialize the sync service
syncService.initializeSync();
```

## Offline Capabilities

The system maintains full functionality when offline:

- Products are cached locally for instant search and retrieval
- Sales transactions are stored locally until connection is restored
- Scale integration continues to function without internet
- All data is synchronized automatically when connection is restored

## Data Models

The system supports the following data models:

- **Product**: SKU, name, price, stock, etc.
- **Sale**: Transaction details, payment methods, etc.
- **SaleItem**: Individual items in a sale
- **Category**: Product categories
- **Customer**: Customer information

## Sync Strategy

The synchronization service implements a bidirectional sync:

- **Pull**: Downloads new/updated products and categories from Supabase
- **Push**: Uploads completed sales and any local updates to Supabase
- **Conflict Resolution**: Maintains sync status to handle conflicts
- **Batch Processing**: Processes records in batches for efficiency

## Testing

A test file is included to verify functionality:

```ts
import { testOfflineCapabilities, testSyncFunctionality } from '@/tests/pos-test';

// Run tests
await testOfflineCapabilities();
await testSyncFunctionality();
```

## Security Considerations

- Sensitive operations are validated both client and server-side
- API keys should be properly secured
- Consider implementing additional authentication for sensitive operations