import { NextResponse } from 'next/server';

export async function GET() {
  // Dummy average call duration (in seconds)
  return NextResponse.json({ data: 95 });
}
