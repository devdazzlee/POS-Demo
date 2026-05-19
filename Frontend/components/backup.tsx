"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Database, Download, Upload, Clock, HardDrive, Shield } from "lucide-react"

export function Backup() {
  const [backups, setBackups] = useState([
    {
      id: "BKP-001",
      name: "Daily Backup - Jan 15",
      type: "Automatic",
      date: "2024-01-15 02:00:00",
      size: "2.3 GB",
      status: "completed",
      duration: "12 minutes",
    },
    {
      id: "BKP-002",
      name: "Manual Backup - Jan 14",
      type: "Manual",
      date: "2024-01-14 16:30:00",
      size: "2.1 GB",
      status: "completed",
      duration: "10 minutes",
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "running":
        return "bg-blue-100 text-blue-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "scheduled":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Backup & Sync</h1>
          <p className="text-sm md:text-base text-gray-600">Data backup and synchronization management</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Restore
          </Button>
          <Button>
            <Database className="w-4 h-4 mr-2" />
            Create Backup
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 hours ago</div>
            <p className="text-xs text-muted-foreground">Automatic backup</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.2 GB</div>
            <p className="text-xs text-muted-foreground">Of 100 GB available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">Available backups</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Excellent</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Backup Schedule</CardTitle>
            <CardDescription>Automated backup configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Daily Backup</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="text-sm text-gray-600">Every day at 2:00 AM</div>
            <div className="flex justify-between items-center">
              <span>Weekly Full Backup</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="text-sm text-gray-600">Every Sunday at 1:00 AM</div>
            <Button className="w-full" variant="outline">
              Configure Schedule
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
            <CardDescription>Backup storage utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Used Storage</span>
                <span>45.2 GB / 100 GB</span>
              </div>
              <Progress value={45.2} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>Database Backups</span>
                  <span>32.1 GB</span>
                </div>
                <div className="flex justify-between">
                  <span>File Backups</span>
                  <span>13.1 GB</span>
                </div>
              </div>
            </div>
            <Button className="w-full" variant="outline">
              Manage Storage
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>Recent backup operations and status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Backup Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">{backup.name}</TableCell>
                  <TableCell>{backup.type}</TableCell>
                  <TableCell className="font-mono text-sm">{backup.date}</TableCell>
                  <TableCell>{backup.size}</TableCell>
                  <TableCell>{backup.duration}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(backup.status)}>{backup.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        Restore
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
