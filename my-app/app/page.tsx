"use client"

import { useState, useEffect } from "react"
// Update the import path if the file exists elsewhere, for example:
import { ThemeProvider } from "./theme-provider"
// Or, if you do not have a ThemeProvider, create one in the correct location.
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Moon, Sun, BarChart3, Users, Phone, Mic, Settings, Bell, User } from "lucide-react"
import { useTheme } from "next-themes"
import DashboardOverview from "@/components/dashboard-overview"
import AgentManagement from "@/components/agent-management"
import CallLogs from "@/components/call-logs"
import CallRecordings from "@/components/call-recordings"
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const navigationItems = [
  {
    title: "Dashboard Overview",
    icon: BarChart3,
    id: "dashboard",
  },
  {
    title: "Agent Management",
    icon: Users,
    id: "agents",
  },
  {
    title: "Call Logs",
    icon: Phone,
    id: "calls",
  },
  {
    title: "Recordings",
    icon: Mic,
    id: "recordings",
  },
]

function AppSidebar({
  activeSection,
}: { activeSection: string; /* setActiveSection: (section: string) => void */ }) {

  const router = useRouter();
  const searchParams = useSearchParams();

  const handleNavigationClick = (sectionId: string) => {
    // Update URL with the selected tab as a query parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', sectionId);
    router.push(`/?${params.toString()}`);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Phone className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">AI Call Center</span>
            <span className="text-xs text-muted-foreground">Admin Dashboard</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handleNavigationClick(item.id)}
                    isActive={activeSection === item.id}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function TopNavbar() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">AI Call Center Dashboard</h1>
          <Badge variant="secondary" className="text-xs">
            Live
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" alt="Admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Admin User</p>
                  <p className="text-xs leading-none text-muted-foreground">admin@callcenter.ai</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

function Dashboard() {
  const searchParams = useSearchParams();

  // Read activeSection from URL query parameter, default to 'dashboard'
  const initialSection = searchParams.get('tab') || 'dashboard';
  const [activeSection, setActiveSection] = useState(initialSection);

  // Update activeSection state when the 'tab' query parameter changes
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && currentTab !== activeSection) {
      setActiveSection(currentTab);
    }
  }, [searchParams, activeSection]); // Re-run effect when searchParams or activeSection changes

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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar activeSection={activeSection} />
          <SidebarInset className="flex flex-1 flex-col">
            <TopNavbar />
            <main className="flex-1 overflow-y-auto">{renderActiveSection()}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default function Page() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
