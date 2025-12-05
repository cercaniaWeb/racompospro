import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return Response.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({
      message: 'Registration successful',
      user: data.user
    }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}