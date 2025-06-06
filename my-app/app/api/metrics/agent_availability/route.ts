import { NextResponse } from 'next/server';

export async function GET() {
  // Dummy agent availability data
  const agentAvailability = [
    { name: 'Agent Smith', status: 'available' },
    { name: 'Agent Doe', status: 'on_call' },
    { name: 'Agent Jane', status: 'offline' },
  ];
  return NextResponse.json({ data: agentAvailability });
}
