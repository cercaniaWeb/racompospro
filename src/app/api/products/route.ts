import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Product } from '@/lib/supabase/types';

export async function GET(req: NextRequest) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return Response.json(data, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient();

  try {
    const productData: Omit<Product, 'id' | 'created_at' | 'updated_at'> = await req.json();

    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return Response.json(data, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}