"use client"

import DashboardOverview from "@/components/dashboard-overview"
import AgentManagement from "@/components/agent-management"
import CallLogs from "@/components/call-logs"
import CallRecordings from "@/components/call-recordings"
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function Dashboard() {
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

export default function Page() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
