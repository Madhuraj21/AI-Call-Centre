"use client"

import DashboardOverview from "@/components/dashboard-overview"
import AgentManagement from "@/components/agent-management"
import CallLogs from "@/components/call-logs"
import CallRecordings from "@/components/call-recordings"
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Separate the content that uses useSearchParams into its own component
function DashboardContent() {
  const searchParams = useSearchParams();
  const activeSection = searchParams.get('tab') || 'dashboard';

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview />
      case "agents":
        return <AgentManagement />
      case "calls":
        return <CallLogs />
      case "recordings":
        return <CallRecordings />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div className="flex flex-col flex-1">
      {renderActiveSection()}
    </div>
  )
}

// Main Dashboard component that wraps the content in Suspense
function Dashboard() {
  return (
    <Suspense fallback={<div className="flex flex-col flex-1 items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}

export default function Page() {
  return <Dashboard />;
}
