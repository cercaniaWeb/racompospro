import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Create a client with anon key for authentication
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return Response.json({ error: error.message }, { status: 401 });
    }

    return Response.json({
      message: 'Login successful',
      user: data.user,
      session: data.session
    }, { status: 200 });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return Response.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}