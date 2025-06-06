import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET() {
  try {
    // Fetch all metrics in parallel
    const [dailyCalls, avgDuration, agentAvailability] = await Promise.all([
      fetch(`${BACKEND_URL}/api/metrics/daily_calls`).then(res => res.json()),
      fetch(`${BACKEND_URL}/api/metrics/avg_call_duration`).then(res => res.json()),
      fetch(`${BACKEND_URL}/api/metrics/agent_availability`).then(res => res.json())
    ]);

    return NextResponse.json({
      dailyCalls,
      avgDuration,
      agentAvailability
    });
  } catch (error) {
    console.error('Error fetching metrics from backend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics from backend' },
      { status: 500 }
    );
  }
} 