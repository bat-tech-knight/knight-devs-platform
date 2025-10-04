"use client";
// ^ this file needs the "use client" pragma

import { HttpLink, ApolloLink } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";

// have a function to create a client for you
function makeClient() {
  const httpLink = new HttpLink({
    // this needs to be an absolute url, as relative urls cannot be used in SSR
    uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://127.0.0.1:54321/graphql/v1',
    // you can disable result caching here if you want to
    // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
    fetchOptions: {
      // you can pass additional options that should be passed to `fetch` here,
      // e.g. Next.js-related `fetch` options regarding caching and revalidation
      // see https://nextjs.org/docs/app/api-reference/functions/fetch#fetchurl-options
    },
    // you can override the default `fetchOptions` on a per query basis
    // via the `context` property on the options passed as a second argument
    // to an Apollo Client data fetching hook, e.g.:
    // const { data } = useSuspenseQuery(MY_QUERY, { context: { fetchOptions: { ... }}});
  });

  // Auth Link for Supabase JWT tokens using SetContextLink
  const authLink = new SetContextLink(async (prevContext) => {
    // Get the Supabase session token from cookies (not localStorage in SSR)
    let token = '';
    
    if (typeof window !== 'undefined') {
      // Client-side: try to get token from Supabase session
      const { createClient } = await import('@/lib/supabase/client');
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || '';
      } catch (error) {
        console.warn('Failed to get Supabase session:', error);
      }
      
      // Fallback to localStorage (for backwards compatibility)
      if (!token) {
        token = localStorage.getItem('sb-access-token') || 
                localStorage.getItem('supabase-auth-token') || 
                '';
      }
    }
    
    return {
      headers: {
        ...prevContext.headers,
        authorization: token ? `Bearer ${token}` : '',
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    };
  });

  // use the `ApolloClient` from "@apollo/client-integration-nextjs"
  return new ApolloClient({
    // use the `InMemoryCache` from "@apollo/client-integration-nextjs"
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // Supabase automatically generates queries for tables
            profilesCollection: {
              merge(existing, incoming) {
                // Handle GraphQL connection structure
                if (!existing && incoming) {
                  return incoming;
                }
                if (!incoming || !existing) {
                  return existing || incoming;
                }
                // Merge connection objects by combining edges and keeping pagination info
                return {
                  ...incoming,
                  edges: [...existing.edges, ...incoming.edges],
                };
              },
            },
          },
        },
        // Define policies for Supabase tables
        profiles: {
          fields: {
            id: {
              merge: false, // IDs should not be merged
            },
          },
        },
      },
    }),
    link: ApolloLink.from([authLink, httpLink]),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
    },
  });
}

// you need to create a component to wrap your app in
export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}