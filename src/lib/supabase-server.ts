/* Use CommonJS require to avoid TypeScript resolving @supabase/supabase-js types
   in environments where the package or its types aren't installed. */
declare const require: any
const { createClient } = require('@supabase/supabase-js') as any

// Minimal `process` declaration for environments without @types/node
declare const process: { env?: { [key: string]: string | undefined } }

export function createServerSupabaseClient() {
  return createClient(
    "https://school-coop.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX..."
  )
}
