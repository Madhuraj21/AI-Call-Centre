"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Search, Filter } from "lucide-react"
import React from "react";

// Define Agent type based on backend response
interface Agent {
  id: number;
  name: string;
  phone_number: string;
  status: "available" | "on_call" | "offline" | "unavailable";
  last_status_update: string;
}

// Add environment variable for backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function AgentManagement() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch agents from backend
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/agents`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        const agentsData = result.data || result;
        if (!Array.isArray(agentsData)) {
          throw new Error('Invalid agents data format received from server');
        }
        setAgents(agentsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching agents:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch agents");
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Filter agents based on search term
  const filteredAgents = agents.filter((agent) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (agent.name?.toLowerCase() || '').includes(searchLower) || // Safely access name
      (agent.phone_number?.toLowerCase() || '').includes(searchLower) || // Safely access phone_number
      (agent.status?.toLowerCase() || '').includes(searchLower) // Safely access status
    );
  });

  // Toggle agent availability
  const toggleAgentStatus = async (agentId: number, currentStatus: Agent['status']) => {
    const newStatus = currentStatus === 'available' ? 'offline' : 'available';
    try {
      const response = await fetch(`${BACKEND_URL}/api/agents/${agentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update agent status');
      }

      const updatedAgent = await response.json();
      setAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent.id === agentId ? { ...agent, ...updatedAgent } : agent
        )
      );
    } catch (error: unknown) {
      console.error("Error updating agent status:", error);
      setError(error instanceof Error ? error.message : "Failed to update agent status");
    }
  };

  const getStatusBadge = (status: Agent['status']) => {
    const variants = {
      available: "default",
      on_call: "secondary",
      offline: "destructive",
      unavailable: "secondary",
    } as const;

    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="w-full space-y-8">
      <div className="w-full">
        <h2 className="text-3xl font-bold tracking-tight">Agent Management</h2>
        <p className="text-muted-foreground">Monitor and manage your call center agents</p>
      </div>

      <Card className="w-full card-hover-effect">
        <CardHeader>
          <CardTitle>Agent Overview</CardTitle>
          <CardDescription>Manage agent availability and monitor performance</CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between w-full">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on_call">On Call</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agents Table */}
          <div className="rounded-md border overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%] min-w-[150px]">Name</TableHead>
                  <TableHead className="w-[35%] min-w-[200px]">Phone Number</TableHead>
                  <TableHead className="w-[20%] min-w-[100px]">Status</TableHead>
                  <TableHead className="text-right w-[20%] min-w-[100px]">Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium w-[25%] min-w-[150px]">{agent.name}</TableCell>
                    <TableCell className="text-muted-foreground w-[35%] min-w-[200px]">{agent.phone_number}</TableCell>
                    <TableCell className="w-[20%] min-w-[100px]">{getStatusBadge(agent.status)}</TableCell>
                    <TableCell className="text-right w-[20%] min-w-[100px]">
                      <Switch
                        checked={agent.status === 'available'}
                        onCheckedChange={() => toggleAgentStatus(agent.id, agent.status)}
                        aria-label={`Toggle availability for ${agent.name}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAgents.length === 0 && !loading && (
            <div className="text-center py-8 w-full">
              <p className="text-muted-foreground">No agents found matching your criteria.</p>
            </div>
          )}
          {loading && (
            <div className="text-center py-8 w-full">
              <p className="text-muted-foreground">Loading agents...</p>
            </div>
          )}
          {error && (
            <div className="text-center py-8 text-red-500 w-full">
              <p>Error: {error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
