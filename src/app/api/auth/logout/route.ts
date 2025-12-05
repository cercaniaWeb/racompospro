import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ message: 'Logout successful' }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}