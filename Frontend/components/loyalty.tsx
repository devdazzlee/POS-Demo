"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Plus, Search, Eye, Star, Users, Award, TrendingUp } from "lucide-react"

interface LoyaltyMember {
  id: string
  name: string
  email: string
  phone: string
  tier: "Bronze" | "Silver" | "Gold" | "Platinum"
  points: number
  totalSpent: number
  joinDate: string
  lastVisit: string
}

interface NewMemberForm {
  name: string
  email: string
  phone: string
  initialPoints: string
}

interface LoyaltySettings {
  pointsPerRupee: number
  redemptionValue: string
  silverThreshold: number
  goldThreshold: number
  platinumThreshold: number
}

export function Loyalty() {
  const [members, setMembers] = useState<LoyaltyMember[]>([
    {
      id: "LM-001",
      name: "John Doe",
      email: "john@example.com",
      phone: "+91 98765 43210",
      tier: "Gold",
      points: 2500,
      totalSpent: 45000,
      joinDate: "2023-06-15",
      lastVisit: "2024-01-20",
    },
    {
      id: "LM-002",
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+91 98765 43211",
      tier: "Silver",
      points: 1200,
      totalSpent: 25000,
      joinDate: "2023-08-20",
      lastVisit: "2024-01-18",
    },
    {
      id: "LM-003",
      name: "Mike Johnson",
      email: "mike@example.com",
      phone: "+91 98765 43212",
      tier: "Bronze",
      points: 800,
      totalSpent: 15000,
      joinDate: "2023-10-10",
      lastVisit: "2024-01-15",
    },
    {
      id: "LM-004",
      name: "Sarah Wilson",
      email: "sarah@example.com",
      phone: "+91 98765 43213",
      tier: "Platinum",
      points: 5200,
      totalSpent: 85000,
      joinDate: "2023-03-05",
      lastVisit: "2024-01-22",
    },
  ])

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isViewMemberOpen, setIsViewMemberOpen] = useState(false)
  const [isAddPointsOpen, setIsAddPointsOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<LoyaltyMember | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [pointsToAdd, setPointsToAdd] = useState("")

  const [newMember, setNewMember] = useState<NewMemberForm>({
    name: "",
    email: "",
    phone: "",
    initialPoints: "0",
  })

  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>({
    pointsPerRupee: 1,
    redemptionValue: "₹1 = 100 points",
    silverThreshold: 1000,
    goldThreshold: 2500,
    platinumThreshold: 5000,
  })

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Bronze":
        return "bg-orange-100 text-orange-800"
      case "Silver":
        return "bg-gray-100 text-gray-800"
      case "Gold":
        return "bg-yellow-100 text-yellow-800"
      case "Platinum":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTierFromPoints = (points: number): LoyaltyMember["tier"] => {
    if (points >= loyaltySettings.platinumThreshold) return "Platinum"
    if (points >= loyaltySettings.goldThreshold) return "Gold"
    if (points >= loyaltySettings.silverThreshold) return "Silver"
    return "Bronze"
  }

  const handleAddMember = () => {
    if (newMember.name && newMember.email && newMember.phone) {
      const points = Number.parseInt(newMember.initialPoints) || 0
      const member: LoyaltyMember = {
        id: `LM-${String(members.length + 1).padStart(3, "0")}`,
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        tier: getTierFromPoints(points),
        points: points,
        totalSpent: 0,
        joinDate: new Date().toISOString().split("T")[0],
        lastVisit: new Date().toISOString().split("T")[0],
      }

      setMembers([...members, member])
      setNewMember({ name: "", email: "", phone: "", initialPoints: "0" })
      setIsAddMemberOpen(false)
    }
  }

  const handleViewMember = (member: LoyaltyMember) => {
    setSelectedMember(member)
    setIsViewMemberOpen(true)
  }

  const handleAddPoints = (member: LoyaltyMember) => {
    setSelectedMember(member)
    setIsAddPointsOpen(true)
  }

  const handleConfirmAddPoints = () => {
    if (selectedMember && pointsToAdd) {
      const points = Number.parseInt(pointsToAdd)
      if (points > 0) {
        const updatedMembers = members.map((member) =>
          member.id === selectedMember.id
            ? {
              ...member,
              points: member.points + points,
              tier: getTierFromPoints(member.points + points),
            }
            : member,
        )
        setMembers(updatedMembers)
        setPointsToAdd("")
        setIsAddPointsOpen(false)
        setSelectedMember(null)
      }
    }
  }

  const handleUpdateSettings = () => {
    // Update tier for all members based on new thresholds
    const updatedMembers = members.map((member) => ({
      ...member,
      tier: getTierFromPoints(member.points),
    }))
    setMembers(updatedMembers)
    alert("Loyalty settings updated successfully!")
  }

  const filterMembersByTier = (tier?: string) => {
    let filtered = members

    if (tier && tier !== "all") {
      filtered = filtered.filter((member) => member.tier.toLowerCase() === tier.toLowerCase())
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.phone.includes(searchTerm) ||
          member.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return filtered
  }

  const getTierDistribution = () => {
    const total = members.length
    const bronze = members.filter((m) => m.tier === "Bronze").length
    const silver = members.filter((m) => m.tier === "Silver").length
    const gold = members.filter((m) => m.tier === "Gold").length
    const platinum = members.filter((m) => m.tier === "Platinum").length

    return {
      bronze: Math.round((bronze / total) * 100),
      silver: Math.round((silver / total) * 100),
      gold: Math.round((gold / total) * 100),
      platinum: Math.round((platinum / total) * 100),
    }
  }

  const distribution = getTierDistribution()

  const MemberTable = ({ tierMembers }: { tierMembers: LoyaltyMember[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead>Points</TableHead>
          <TableHead>Total Spent</TableHead>
          <TableHead>Join Date</TableHead>
          <TableHead>Last Visit</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tierMembers.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="font-medium">{member.id}</TableCell>
            <TableCell>{member.name}</TableCell>
            <TableCell>
              <div className="text-sm">
                <div>{member.email}</div>
                <div className="text-gray-500">{member.phone}</div>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={getTierColor(member.tier)}>{member.tier}</Badge>
            </TableCell>
            <TableCell>{member.points.toLocaleString()}</TableCell>
            <TableCell>₹{member.totalSpent.toLocaleString()}</TableCell>
            <TableCell>{member.joinDate}</TableCell>
            <TableCell>{member.lastVisit}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleViewMember(member)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAddPoints(member)}>
                  Add Points
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Loyalty Program</h1>
          <p className="text-gray-600">Manage customer loyalty and rewards</p>
        </div>
        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Loyalty Member</DialogTitle>
              <DialogDescription>Enroll a new customer in the loyalty program</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member-name">Customer Name</Label>
                <Input
                  placeholder="Enter customer name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-email">Email</Label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-phone">Phone</Label>
                <Input
                  placeholder="Enter phone number"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial-points">Initial Points (Optional)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newMember.initialPoints}
                  onChange={(e) => setNewMember({ ...newMember, initialPoints: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember}>Add Member</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Member Dialog */}
        <Dialog open={isViewMemberOpen} onOpenChange={setIsViewMemberOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
              <DialogDescription>View loyalty member information</DialogDescription>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Member ID</Label>
                    <p className="text-lg font-semibold">{selectedMember.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Name</Label>
                    <p className="text-lg font-semibold">{selectedMember.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p>{selectedMember.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Phone</Label>
                    <p>{selectedMember.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Current Tier</Label>
                    <Badge className={getTierColor(selectedMember.tier)}>{selectedMember.tier}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Points Balance</Label>
                    <p className="text-lg font-semibold">{selectedMember.points.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Total Spent</Label>
                    <p className="text-lg font-semibold">₹{selectedMember.totalSpent.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Join Date</Label>
                    <p>{selectedMember.joinDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Last Visit</Label>
                    <p>{selectedMember.lastVisit}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsViewMemberOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Points Dialog */}
        <Dialog open={isAddPointsOpen} onOpenChange={setIsAddPointsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Points</DialogTitle>
              <DialogDescription>Add loyalty points to {selectedMember?.name}'s account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Points</Label>
                <p className="text-2xl font-bold">{selectedMember?.points.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="points-to-add">Points to Add</Label>
                <Input
                  type="number"
                  placeholder="Enter points to add"
                  value={pointsToAdd}
                  onChange={(e) => setPointsToAdd(e.target.value)}
                />
              </div>
              {pointsToAdd && (
                <div className="space-y-2">
                  <Label>New Total</Label>
                  <p className="text-lg font-semibold">
                    {((selectedMember?.points || 0) + Number.parseInt(pointsToAdd || "0")).toLocaleString()} points
                  </p>
                  <p className="text-sm text-gray-500">
                    New Tier: {getTierFromPoints((selectedMember?.points || 0) + Number.parseInt(pointsToAdd || "0"))}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddPointsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmAddPoints}>Add Points</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.reduce((sum, m) => sum + m.points, 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Points in circulation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Points</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(members.reduce((sum, m) => sum + m.points, 0) / members.length).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Per member</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{members.reduce((sum, m) => sum + m.totalSpent, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">By all members</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tier Distribution</CardTitle>
            <CardDescription>Member distribution across tiers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Bronze (0-{loyaltySettings.silverThreshold - 1} points)</span>
                <span>{distribution.bronze}%</span>
              </div>
              <Progress value={distribution.bronze} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>
                  Silver ({loyaltySettings.silverThreshold}-{loyaltySettings.goldThreshold - 1} points)
                </span>
                <span>{distribution.silver}%</span>
              </div>
              <Progress value={distribution.silver} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>
                  Gold ({loyaltySettings.goldThreshold}-{loyaltySettings.platinumThreshold - 1} points)
                </span>
                <span>{distribution.gold}%</span>
              </div>
              <Progress value={distribution.gold} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Platinum ({loyaltySettings.platinumThreshold}+ points)</span>
                <span>{distribution.platinum}%</span>
              </div>
              <Progress value={distribution.platinum} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loyalty Settings</CardTitle>
            <CardDescription>Configure loyalty program rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Points per ₹1 spent</Label>
              <Input
                type="number"
                value={loyaltySettings.pointsPerRupee}
                onChange={(e) =>
                  setLoyaltySettings({ ...loyaltySettings, pointsPerRupee: Number.parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Points redemption value</Label>
              <Input
                value={loyaltySettings.redemptionValue}
                onChange={(e) => setLoyaltySettings({ ...loyaltySettings, redemptionValue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tier upgrade thresholds</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Silver threshold"
                  type="number"
                  value={loyaltySettings.silverThreshold}
                  onChange={(e) =>
                    setLoyaltySettings({ ...loyaltySettings, silverThreshold: Number.parseInt(e.target.value) || 1000 })
                  }
                />
                <Input
                  placeholder="Gold threshold"
                  type="number"
                  value={loyaltySettings.goldThreshold}
                  onChange={(e) =>
                    setLoyaltySettings({ ...loyaltySettings, goldThreshold: Number.parseInt(e.target.value) || 2500 })
                  }
                />
              </div>
              <Input
                placeholder="Platinum threshold"
                type="number"
                value={loyaltySettings.platinumThreshold}
                onChange={(e) =>
                  setLoyaltySettings({ ...loyaltySettings, platinumThreshold: Number.parseInt(e.target.value) || 5000 })
                }
              />
            </div>
            <Button className="w-full" onClick={handleUpdateSettings}>
              Update Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Members</TabsTrigger>
          <TabsTrigger value="bronze">Bronze</TabsTrigger>
          <TabsTrigger value="silver">Silver</TabsTrigger>
          <TabsTrigger value="gold">Gold</TabsTrigger>
          <TabsTrigger value="platinum">Platinum</TabsTrigger>
        </TabsList>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search members..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Loyalty Members</CardTitle>
              <CardDescription>Complete list of loyalty program members</CardDescription>
            </CardHeader>
            <CardContent>
              <MemberTable tierMembers={filterMembersByTier()} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bronze">
          <Card>
            <CardHeader>
              <CardTitle>Bronze Members</CardTitle>
              <CardDescription>Members with Bronze tier status</CardDescription>
            </CardHeader>
            <CardContent>
              <MemberTable tierMembers={filterMembersByTier("bronze")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="silver">
          <Card>
            <CardHeader>
              <CardTitle>Silver Members</CardTitle>
              <CardDescription>Members with Silver tier status</CardDescription>
            </CardHeader>
            <CardContent>
              <MemberTable tierMembers={filterMembersByTier("silver")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gold">
          <Card>
            <CardHeader>
              <CardTitle>Gold Members</CardTitle>
              <CardDescription>Members with Gold tier status</CardDescription>
            </CardHeader>
            <CardContent>
              <MemberTable tierMembers={filterMembersByTier("gold")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platinum">
          <Card>
            <CardHeader>
              <CardTitle>Platinum Members</CardTitle>
              <CardDescription>Members with Platinum tier status</CardDescription>
            </CardHeader>
            <CardContent>
              <MemberTable tierMembers={filterMembersByTier("platinum")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
