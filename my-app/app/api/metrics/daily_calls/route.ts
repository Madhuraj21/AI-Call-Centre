import { NextResponse } from 'next/server';

export async function GET() {
  // Dummy daily calls data
  const dailyCalls = [
    { date: '2025-06-01', count: 10 },
    { date: '2025-06-02', count: 15 },
    { date: '2025-06-03', count: 8 },
    { date: '2025-06-04', count: 12 },
  ];
  return NextResponse.json({ data: dailyCalls });
}
