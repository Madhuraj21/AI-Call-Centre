"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Define CallLog type based on backend response
interface CallLog {
  id: number;
  call_sid: string;
  caller_number: string;
  agent_name: string | null; // Agent name can be null if not assigned
  start_time: string;
  end_time: string | null;
  duration: number | null; // Duration in seconds
  status: string;
  recording_url: string | null;
  ai_interaction_summary: string | null;
}

export default function CallLogs() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]) // Initialize with empty array
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCalls, setTotalCalls] = useState(0); // State for total number of calls
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state


  const itemsPerPage = 10 // Increased items per page to match backend default

  // Fetch call logs from the backend API
  useEffect(() => {
    const fetchCallLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${BACKEND_URL}/api/calls`);
        if (!response.ok) {
          throw new Error('Failed to fetch call logs');
        }
        const data = await response.json();
        // Handle both response formats (array or {data, total})
        const logs = Array.isArray(data) ? data : (data.data || []);
        setCallLogs(logs);
        setTotalCalls(logs.length);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
          console.error("Error fetching call logs:", err);
        } else {
          setError("An unknown error occurred.");
          console.error("An unknown error occurred:", err);
        }
        setCallLogs([]); // Clear logs on error
        setTotalCalls(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCallLogs();
  }, []); // Only fetch once on mount

  // Calculate total pages based on totalCalls and itemsPerPage
  const totalPages = Math.ceil(totalCalls / itemsPerPage);

  // Filter logs
  const filteredLogs = callLogs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (log.caller_number?.toLowerCase() || '').includes(searchLower) ||
      (log.agent_name?.toLowerCase() || '').includes(searchLower) ||
      (log.status?.toLowerCase() || '').includes(searchLower)
    );
  });

  // Paginate the filtered logs (use filteredLogs directly as sorting is removed)
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  // Calculate the range of items being displayed
  const startItem = startIndex + 1;
  const endItem = Math.min(startIndex + itemsPerPage, totalCalls);

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default", // Use lowercase status from backend
      'in-progress': "secondary", // Use lowercase status from backend
      missed: "destructive", // Use lowercase status from backend
      abandoned: "destructive", // Add abandoned status
      transferred: "secondary", // Add transferred status
      initiated: "secondary", // Add initiated status
      ringing: "secondary", // Add ringing status
      answered: "secondary", // Add answered status
      failed: "destructive", // Add failed status
      'no-answer': "destructive", // Add no-answer status
      busy: "destructive", // Add busy status
      canceled: "destructive", // Add canceled status
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
  }

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  const formatDuration = (durationInSeconds: number | null) => {
    if (durationInSeconds === null || durationInSeconds === undefined) return "N/A";
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return (
    <div className="w-full space-y-8">
      <div className="w-full">
        <h2 className="text-3xl font-bold tracking-tight">Call Logs</h2>
        <p className="text-muted-foreground">View and search through recent call history</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
          <CardDescription>Complete history of all incoming and outgoing calls</CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 justify-between w-full">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by caller number, agent, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
          </div>

          {/* Call Logs Table */}
          <div className="rounded-md border overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[15%]">Caller Number</TableHead>
                  <TableHead className="w-[20%]">Agent Assigned</TableHead>
                  <TableHead className="w-[10%]">Duration</TableHead>
                  <TableHead className="w-[15%]">Status</TableHead>
                  <TableHead className="w-[40%]">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log: CallLog) => (
                  <TableRow key={log.id} className="transition-colors hover:bg-muted/50">
                    <TableCell className="font-medium w-[15%]">{log.caller_number}</TableCell>
                    <TableCell className="w-[20%]">{log.agent_name}</TableCell>
                    <TableCell className="font-mono text-sm w-[10%]">{formatDuration(log.duration)}</TableCell>
                    <TableCell className="w-[15%]">{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground w-[40%]">{formatTimestamp(log.start_time)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {paginatedLogs.length === 0 && !loading && (
            <div className="text-center py-8 w-full">
              <p className="text-muted-foreground">No call logs found matching your criteria.</p>
            </div>
          )}
          {loading && (
            <div className="text-center py-8 w-full">
              <p className="text-muted-foreground">Loading call logs...</p>
            </div>
          )}
          {error && (
            <div className="text-center py-8 text-red-500 w-full">
              <p>Error: {error}</p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 space-x-2 py-4 w-full">
            <div className="text-sm text-muted-foreground">
              Showing {startItem} to {endItem} of {totalCalls} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {totalPages <= 20 ? (Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))) : (
                  <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
