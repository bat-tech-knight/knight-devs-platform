# Server/Client Component Split Pattern

This document explains the server/client component split pattern implemented in this project, which provides clean separation between data handling and UI components.

## Architecture Overview

The pattern follows this structure:

```
app/
├── [feature]/
│   ├── page.tsx              # Server component (data fetching)
│   ├── [feature]-data.tsx    # Server-side data functions
│   ├── [feature]-hooks.ts    # Client-side hooks
│   └── [feature]-view.tsx   # Client component (UI)
```

## Key Benefits

1. **Server-side data fetching**: Initial data is fetched on the server for better performance
2. **Client-side interactivity**: UI components can be interactive without hydration issues
3. **Clean separation**: Data logic is separated from UI logic
4. **Reusable patterns**: Generic utilities for common operations
5. **Type safety**: Full TypeScript support throughout the stack

## Implementation Pattern

### 1. Server Component (page.tsx)

```typescript
import { getData } from "./feature-data";
import { FeatureView } from "./feature-view";

export default async function FeaturePage() {
  // Server component - handles data fetching and authentication
  const initialData = await getData();

  return (
    <FeatureView initialData={initialData} />
  );
}
```

### 2. Data Layer (feature-data.tsx)

```typescript
import { createClient } from "@/lib/supabase/server";
import { requireAdminAuth, createServerDataFetcher } from "@/lib/server-auth";

export interface FeatureData {
  // Define your data types
}

export async function getData(): Promise<FeatureData[]> {
  // Ensure user is authenticated and authorized
  await requireAdminAuth();

  return createServerDataFetcher(async () => {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('table_name')
      .select('*');

    if (error) {
      throw error;
    }

    return data || [];
  }, 'Fetch feature data');
}
```

### 3. Client Hooks (feature-hooks.ts)

```typescript
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FeatureData } from "./feature-data";

export function useFeatureData(initialData: FeatureData[]) {
  const [data, setData] = useState<FeatureData[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('table_name')
        .select('*');

      if (error) {
        throw new Error(error.message);
      }

      setData(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (item: Omit<FeatureData, 'id'>) => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('table_name')
        .insert([item])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setData(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    refreshData,
    createItem,
  };
}
```

### 4. Client View Component (feature-view.tsx)

```typescript
"use client";

import { useFeatureData } from "./hooks";
import { FeatureData } from "./feature-data";

interface FeatureViewProps {
  initialData: FeatureData[];
}

export function FeatureView({ initialData }: FeatureViewProps) {
  const { data, loading, error, refreshData, createItem } = useFeatureData(initialData);

  return (
    <div>
      {/* Your UI components here */}
      {/* Use data, loading, error states */}
      {/* Implement refresh and create functionality */}
    </div>
  );
}
```

## Generic Utilities

### Server Authentication (`lib/server-auth.ts`)

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireAdminAuth() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    redirect("/protected");
  }

  return { user, profile };
}

export async function createServerDataFetcher<T>(
  fetcher: () => Promise<T>,
  operation: string
): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    const message = error?.message || 'Unknown error occurred';
    throw new Error(`${operation} failed: ${message}`);
  }
}
```

## Usage Examples

### Admin Dashboard
- **Server**: `app/admin/page.tsx` - Fetches initial stats
- **Data**: `app/admin/admin-data.tsx` - Server-side data functions
- **Hooks**: `app/admin/hooks.ts` - Client-side state management
- **View**: `app/admin/admin-view.tsx` - Interactive dashboard UI

### Scraping Configuration
- **Server**: `app/admin/scraping/page.tsx` - Fetches initial configs
- **Data**: `app/admin/scraping/scraping-data.tsx` - CRUD operations
- **Hooks**: `app/admin/scraping/scraping-hooks.ts` - Form and data management
- **View**: `components/admin/scraping-config-manager.tsx` - Configuration UI

## Best Practices

1. **Always use server components for initial data fetching**
2. **Use client components only for interactive features**
3. **Implement proper error handling at both server and client levels**
4. **Use TypeScript interfaces for type safety**
5. **Leverage generic utilities for common patterns**
6. **Keep data fetching logic separate from UI logic**
7. **Use optimistic updates for better UX**

## Migration Guide

To migrate an existing client component to this pattern:

1. **Extract data fetching** to a server component
2. **Create data layer** with server-side functions
3. **Create client hooks** for state management
4. **Split UI** into view components
5. **Update imports** and component structure

This pattern ensures better performance, cleaner code, and easier maintenance while leveraging Next.js 13+ App Router features.
