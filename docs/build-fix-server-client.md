# Server/Client Component Split - Build Fix

## Issue Resolved

The build was failing because `next/headers` (used in `lib/supabase/server.ts`) was being imported in a client component. The error occurred when `AuthButton` (a server component) was used in `app/admin/layout.tsx` (a client component).

## Solution

Created a client-side version of the auth button to handle authentication in client components:

### Files Created:
- `components/auth-button-client.tsx` - Client-side auth button with real-time auth state updates

### Files Updated:
- `app/admin/layout.tsx` - Updated to use `AuthButtonClient` instead of `AuthButton`

## Key Differences

### Server AuthButton (`components/auth-button.tsx`)
- Uses `createClient` from `@/lib/supabase/server`
- Fetches auth state on server
- No real-time updates
- Used in server components

### Client AuthButton (`components/auth-button-client.tsx`)
- Uses `createClient` from `@/lib/supabase/client`
- Fetches auth state on client
- Real-time auth state updates via `onAuthStateChange`
- Used in client components

## Usage Guidelines

- **Server Components**: Use `AuthButton` for initial server-side rendering
- **Client Components**: Use `AuthButtonClient` for interactive layouts and components
- **Layouts**: Use `AuthButtonClient` if the layout needs client-side interactivity (like the admin sidebar)

This pattern ensures proper separation between server and client components while maintaining functionality.
