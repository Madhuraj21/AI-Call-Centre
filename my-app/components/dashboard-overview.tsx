"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, PhoneCall, Users, PhoneMissed } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useEffect, useState } from "react"
import React from "react";
import { LucideProps } from 'lucide-react';

// Define types for data
type KpiData = {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  description: string;
};

type ChartData = {
  hour: string;
  calls: number;
};

// Define types for API responses
interface MetricsData {
  dailyCalls: {
    total: number;
    change: number;
  };
  avgDuration: {
    seconds: number;
    change: number;
  };
  agentAvailability: {
    available: number;
    on_call: number;
    offline: number;
    total: number;
  };
}

export default function DashboardOverview() {
  const [kpis, setKpis] = useState<KpiData[]>([
    {
      title: "Total Calls Today",
      value: "Loading...",
      change: "",
      changeType: "neutral",
      icon: Phone,
      description: "",
    },
    {
      title: "Active Calls Now",
      value: "Loading...",
      change: "",
      changeType: "neutral",
      icon: PhoneCall,
      description: "",
    },
    {
      title: "Available Agents",
      value: "Loading...",
      change: "",
      changeType: "neutral",
      icon: Users,
      description: "",
    },
    {
      title: "Missed Calls",
      value: "Loading...",
      change: "",
      changeType: "neutral",
      icon: PhoneMissed,
      description: "",
    },
  ]);
  const [agentData, setAgentData] = useState<{ name: string; value: number; color: string }[]>([
    { name: "Available", value: 0, color: "#22c55e" },
    { name: "Busy", value: 0, color: "#f59e0b" },
    { name: "Offline", value: 0, color: "#ef4444" },
  ]);
  const [callData, setCallData] = useState<ChartData[]>([{ hour: "Now", calls: 0 }]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const data: MetricsData = await response.json();

        // Update KPIs with real data
        setKpis([
          {
            title: "Total Calls Today",
            value: data.dailyCalls.total.toString(),
            change: `${data.dailyCalls.change > 0 ? '+' : ''}${data.dailyCalls.change}%`,
            changeType: data.dailyCalls.change > 0 ? "positive" : data.dailyCalls.change < 0 ? "negative" : "neutral",
            icon: Phone,
            description: "Compared to yesterday",
          },
          {
            title: "Active Calls Now",
            value: data.agentAvailability.on_call.toString(),
            change: "Live",
            changeType: "neutral",
            icon: PhoneCall,
            description: `Currently in progress. Avg Duration: ${Math.round(data.avgDuration.seconds / 60)} minutes`,
          },
          {
            title: "Available Agents",
            value: data.agentAvailability.available.toString(),
            change: `${Math.round((data.agentAvailability.available / data.agentAvailability.total) * 100)}%`,
            changeType: "positive",
            icon: Users,
            description: `Out of ${data.agentAvailability.total} total agents`,
          },
          {
            title: "Missed Calls",
            value: "0", // TODO: Add missed calls metric to backend
            change: "-25%",
            changeType: "positive",
            icon: PhoneMissed,
            description: "Compared to yesterday",
          },
        ]);

        // Update agent availability chart
        setAgentData([
          { name: "Available", value: data.agentAvailability.available, color: "#22c55e" },
          { name: "Busy", value: data.agentAvailability.on_call, color: "#f59e0b" },
          { name: "Offline", value: data.agentAvailability.offline, color: "#ef4444" },
        ]);

        // Update call data chart (placeholder for now)
        setCallData([{ hour: "Now", calls: data.dailyCalls.total }]);

      } catch (error) {
        console.error("Error fetching metrics:", error);
      }
    };

    fetchMetrics();
    // Refresh metrics every minute
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-8">
      <div className="w-full">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Real-time insights into your AI call center performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full">
        {kpis.map((kpi, index) => (
          <Card key={index} className="w-full transition-all duration-200 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-grow">
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge
                  variant={
                    kpi.changeType === "positive"
                      ? "default"
                      : kpi.changeType === "negative"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {kpi.change}
                </Badge>
                <p className="text-xs text-muted-foreground">{kpi.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 w-full">
        {/* Calls per Hour Chart */}
        <Card className="w-full transition-all duration-200 hover:shadow-lg flex flex-col">
          <CardHeader>
            <CardTitle>Calls per Hour (Today)</CardTitle>
            <CardDescription>Real-time call volume throughout the day</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-4">
            <ChartContainer
              config={{
                calls: {
                  label: "Calls",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={callData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="calls"
                    stroke="var(--color-calls)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-calls)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Agent Availability Chart */}
        <Card className="w-full transition-all duration-200 hover:shadow-lg flex flex-col h-full">
          <CardHeader className="pb-4">
            <CardTitle>Agent Availability</CardTitle>
            <CardDescription>Current status of all agents</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-4">
            <ChartContainer
              config={{
                available: {
                  label: "Available",
                  color: "#22c55e",
                },
                busy: {
                  label: "Busy",
                  color: "#f59e0b",
                },
                offline: {
                  label: "Offline",
                  color: "#ef4444",
                },
              }}
              className="h-[250px] w-full aspect-square max-h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <Pie
                    data={agentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {agentData.map((item, index) => (
                      <Cell key={`cell-${index}`} fill={item.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent hideLabel={true} />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
          <div className="flex justify-center space-x-4 p-4 pt-0">
            {agentData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
