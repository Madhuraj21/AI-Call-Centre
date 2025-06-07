"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Play, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

// Define CallRecording type based on backend response
interface CallRecording {
  id: number;
  callerNumber: string;
  agentName: string;
  duration: string; // Change to string to match mock data
  recordingUrl: string | null; // Can be null
  dateTime: string; // Use dateTime to match mock data
  fileSize: string;
  status: string; // Add status property
}

// Mock recording data
const mockRecordings: CallRecording[] = [
  {
    id: 1,
    callerNumber: "+1 (555) 123-4567",
    agentName: "Sarah Johnson",
    duration: "00:05:23",
    recordingUrl: "/api/recordings/rec_001.mp3",
    dateTime: "2024-01-15 14:32:15",
    fileSize: "2.1 MB",
    status: "completed", // Add status
  },
  {
    id: 2,
    callerNumber: "+1 (555) 234-5678",
    agentName: "Mike Chen",
    duration: "00:12:45",
    recordingUrl: "/api/recordings/rec_002.mp3",
    dateTime: "2024-01-15 14:28:42",
    fileSize: "5.2 MB",
    status: "completed", // Add status
  },
  {
    id: 3,
    callerNumber: "+1 (555) 345-6789",
    agentName: "Emily Rodriguez",
    duration: "00:08:17",
    recordingUrl: "/api/recordings/rec_003.mp3",
    dateTime: "2024-01-15 14:22:03",
    fileSize: "3.4 MB",
    status: "missed", // Add status
  },
  {
    id: 4,
    callerNumber: "+1 (555) 456-7890",
    agentName: "David Kim",
    duration: "00:15:32",
    recordingUrl: "/api/recordings/rec_004.mp3",
    dateTime: "2024-01-15 14:18:55",
    fileSize: "6.3 MB",
    status: "completed", // Add status
  },
  {
    id: 5,
    callerNumber: "+1 (555) 567-8901",
    agentName: "Lisa Thompson",
    duration: "00:03:41",
    recordingUrl: "/api/recordings/rec_005.mp3",
    dateTime: "2024-01-15 14:15:27",
    fileSize: "1.5 MB",
    status: "failed", // Add status
  },
  {
    id: 6,
    callerNumber: "+1 (555) 678-9012",
    agentName: "James Wilson",
    duration: "00:07:58",
    recordingUrl: "/api/recordings/rec_006.mp3",
    dateTime: "2024-01-15 14:12:14",
    fileSize: "3.2 MB",
    status: "completed", // Add status
  },
  {
    id: 7,
    callerNumber: "+1 (555) 789-0123",
    agentName: "Maria Garcia",
    duration: "00:11:22",
    recordingUrl: "/api/recordings/rec_007.mp3",
    dateTime: "2024-01-15 14:05:16",
    fileSize: "4.6 MB",
    status: "completed", // Add status
  },
  {
    id: 8,
    callerNumber: "+1 (555) 890-1234",
    agentName: "Robert Brown",
    duration: "00:06:47",
    recordingUrl: "/api/recordings/rec_008.mp3",
    dateTime: "2024-01-15 14:02:08",
    fileSize: "2.7 MB",
    status: "missed", // Add status
  },
]

export default function CallRecordings() {
  const [recordings] = useState<CallRecording[]>(mockRecordings)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [selectedRecording, setSelectedRecording] = useState<typeof mockRecordings[0] | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const totalRecordings = mockRecordings.length; // Use a constant since it's based on mock data

  const itemsPerPage = 6

  // Filter recordings based on search term
  const filteredRecordings = recordings.filter(
    (recording) =>
      recording.callerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.agentName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Paginate results
  const totalPages = Math.ceil(totalRecordings / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRecordings = filteredRecordings.slice(startIndex, startIndex + itemsPerPage)

  // Calculate the range of items being displayed
  const startItem = startIndex + 1;
  const endItem = Math.min(startIndex + itemsPerPage, totalRecordings);

  const handlePlay = (recordingId: number) => {
    if (playingId === recordingId) {
      setPlayingId(null) // Pause if already playing
    } else {
      setPlayingId(recordingId) // Play new recording
    }
    // In a real app, you would integrate with an audio player here
    console.log(`Playing/Pausing recording ${recordingId}`)
  }

  const handleDownload = (recording: CallRecording) => {
    if (!recording.recordingUrl) {
      console.warn("No recording URL available for download.");
      return; // Prevent download if no URL
    }
    // In a real app, this would trigger a download from the server
    console.log(`Downloading recording: ${recording.recordingUrl}`)
    // Simulate download
    const link = document.createElement("a")
    link.href = recording.recordingUrl // recordingUrl is guaranteed to be string here
    link.download = `recording_${recording.id}_${recording.callerNumber.replace(/\D/g, "")}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }


  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      'in-progress': "secondary",
      missed: "destructive",
      abandoned: "destructive",
      transferred: "secondary",
      initiated: "secondary",
      ringing: "secondary",
      answered: "secondary",
      failed: "destructive",
      'no-answer': "destructive",
      busy: "destructive",
      canceled: "destructive",
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>;
  };

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

  const handlePlayRecording = (recording: CallRecording) => {
    setSelectedRecording(recording)
    handlePlay(recording.id)
  }

  const handleDownloadRecording = (recording: CallRecording) => {
    handleDownload(recording)
  }

  return (
    <div className="w-full space-y-8">
      <div className="w-full">
        <h2 className="text-3xl font-bold tracking-tight">Call Recordings</h2>
        <p className="text-muted-foreground">Access and manage recorded calls</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Available Recordings</CardTitle>
          <CardDescription>Browse and listen to recorded calls</CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 justify-between w-full">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by caller number or agent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recordings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {paginatedRecordings.map((recording: CallRecording) => (
              <Card key={recording.id} className="w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg truncate">{recording.callerNumber}</CardTitle>
                  <CardDescription className="truncate">Agent: {recording.agentName}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-mono">{formatDuration(parseFloat(recording.duration.split(':')[0])*3600 + parseFloat(recording.duration.split(':')[1])*60 + parseFloat(recording.duration.split(':')[2]))}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{formatTimestamp(recording.dateTime)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(recording.status)}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                        <Button
                    variant="outline"
                          size="sm"
                    onClick={() => handlePlayRecording(recording)}
                    disabled={!recording.recordingUrl}
                        >
                    <Play className="h-4 w-4 mr-2" />
                    Play
                        </Button>
                        <Button
                    variant="outline"
                          size="sm"
                    onClick={() => handleDownloadRecording(recording)}
                    disabled={!recording.recordingUrl}
                        >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                        </Button>
                </CardFooter>
              </Card>
                ))}
          </div>

          {filteredRecordings.length === 0 && (
            <div className="text-center py-8 w-full">
              <p className="text-muted-foreground">No recordings found matching your criteria.</p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 space-x-2 py-4 w-full">
            <div className="text-sm text-muted-foreground">
              Showing {startItem} to {endItem} of {totalRecordings} results
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
                {totalPages > 1 && Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
                {totalPages <= 1 && (
                  <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages <= 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Player Dialog */}
      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Play Recording</DialogTitle>
            <DialogDescription>
              {selectedRecording && (
                <div className="space-y-2">
                  <p>Caller: {selectedRecording.callerNumber}</p>
                  <p>Agent: {selectedRecording.agentName}</p>
                  <p>Date: {formatTimestamp(selectedRecording.dateTime)}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <audio
              controls
              className="w-full"
              src={selectedRecording?.recordingUrl ?? undefined}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
