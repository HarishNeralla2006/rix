import { createClient, type SupabaseClient, type AuthError } from '@supabase/supabase-js';

// Use environment variables, with a fallback to the provided credentials.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://enzqwlcwskmofyiumkqk.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuenF3bGN3c2ttb2Z5aXVta3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NDI1NjksImV4cCI6MjA3NDAxODU2OX0.DxBYnqTjtKe23OjiW057LDPjRpN2SFLLuS3G4HxRYgM';

// isSupabaseConfigured will now be true, effectively enabling the real client.
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

let supabase: SupabaseClient;

if (isSupabaseConfigured) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    // This 'else' block remains as a safeguard for developers who might remove the fallback keys.
    const errorStyle = 'color: red; font-size: 14px; font-weight: bold;';
    console.error('%cSupabase environment variables are not set!', errorStyle);
    console.error('Please provide SUPABASE_URL and SUPABASE_ANON_KEY for the application to function correctly.');
    
    // Fix: Use a double assertion to correctly cast the mock object to AuthError.
    // A direct cast fails because `__isAuthError` is a protected property.
    const mockError = {
        name: 'ConfigurationError',
        message: 'Supabase URL or Key is not configured.',
        status: 500,
        code: '500',
        __isAuthError: true,
    } as unknown as AuthError;

    // Create a mock client that prevents crashing and returns errors for auth operations.
    // This allows the app to load and function in a degraded state.
    supabase = {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: mockError }),
            signUp: () => Promise.resolve({ data: { user: null, session: null }, error: mockError }),
            signOut: () => Promise.resolve({ error: null }),
        },
        // Mock the 'from' method to prevent crashes if other Supabase features are used.
        from: () => ({
            select: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } as any }),
            insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } as any }),
            update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } as any }),
            delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } as any }),
        }),
    } as any; // Using 'as any' because mocking the entire SupabaseClient is extensive.
}

export { supabase };
