import { NextResponse } from 'next/server';

const GIPHY_API_KEY = process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC'; // Fallback to public beta key

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const limit = searchParams.get('limit') || 25;

  let url = `https://api.giphy.com/v1/stickers/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`;
  if (q) {
    url = `https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&offset=0&rating=g&lang=en`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.meta?.msg || 'Giphy API error');

    const stickers = data.data.map(item => ({
      id: item.id,
      url: item.images.fixed_height.url,
      title: item.title,
      width: item.images.fixed_height.width,
      height: item.images.fixed_height.height
    }));

    return NextResponse.json({ stickers });
  } catch (error) {
    console.error('[Stickers API]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
