import { createClient } from '@supabase/supabase-js'

// Server-side client — uses SERVICE_ROLE_KEY (bypasses RLS)
// ONLY use in API routes and server-side code
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase server environment variables')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (input, init) => {
        return fetch(input, {
          ...init,
          cache: 'no-store',
        })
      },
    },
  })
}

// Browser-side client — uses ANON_KEY (subject to RLS)
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(url, key)
}
