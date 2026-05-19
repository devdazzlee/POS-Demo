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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, TrendingUp, Percent, DollarSign, Target, Edit, Play } from "lucide-react"

interface PricingRule {
  id: string
  name: string
  category: string
  type: string
  value: number
  status: "active" | "inactive"
  products: number
}

interface NewRuleForm {
  name: string
  category: string
  type: string
  value: string
}

export function Pricing() {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([
    {
      id: "PR-001",
      name: "Electronics Markup",
      category: "Electronics",
      type: "markup",
      value: 25,
      status: "active",
      products: 45,
    },
    {
      id: "PR-002",
      name: "Bulk Discount",
      category: "All",
      type: "quantity_discount",
      value: 10,
      status: "active",
      products: 120,
    },
  ])

  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false)
  const [isEditRuleOpen, setIsEditRuleOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [newRule, setNewRule] = useState<NewRuleForm>({
    name: "",
    category: "",
    type: "",
    value: "",
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case "markup":
        return "bg-green-100 text-green-800"
      case "discount":
        return "bg-red-100 text-red-800"
      case "quantity_discount":
        return "bg-blue-100 text-blue-800"
      case "seasonal":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleCreateRule = () => {
    if (newRule.name && newRule.category && newRule.type && newRule.value) {
      const rule: PricingRule = {
        id: `PR-${String(pricingRules.length + 1).padStart(3, "0")}`,
        name: newRule.name,
        category: newRule.category,
        type: newRule.type,
        value: Number.parseFloat(newRule.value),
        status: "active",
        products: Math.floor(Math.random() * 100) + 1,
      }

      setPricingRules([...pricingRules, rule])
      setNewRule({ name: "", category: "", type: "", value: "" })
      setIsCreateRuleOpen(false)
    }
  }

  const handleEditRule = (rule: PricingRule) => {
    setEditingRule(rule)
    setNewRule({
      name: rule.name,
      category: rule.category,
      type: rule.type,
      value: rule.value.toString(),
    })
    setIsEditRuleOpen(true)
  }

  const handleUpdateRule = () => {
    if (editingRule && newRule.name && newRule.category && newRule.type && newRule.value) {
      const updatedRules = pricingRules.map((rule) =>
        rule.id === editingRule.id
          ? {
            ...rule,
            name: newRule.name,
            category: newRule.category,
            type: newRule.type,
            value: Number.parseFloat(newRule.value),
          }
          : rule,
      )

      setPricingRules(updatedRules)
      setNewRule({ name: "", category: "", type: "", value: "" })
      setEditingRule(null)
      setIsEditRuleOpen(false)
    }
  }

  const handleApplyRule = (ruleId: string) => {
    // Simulate applying the rule
    alert(`Applied pricing rule ${ruleId} to products`)
  }

  const filteredRules = pricingRules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Pricing & Margins</h1>
          <p className="text-sm md:text-base text-gray-600">Manage pricing strategies and profit margins</p>
        </div>
        <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Pricing Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Pricing Rule</DialogTitle>
              <DialogDescription>Set up automated pricing rules</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  placeholder="Enter rule name"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newRule.category}
                    onValueChange={(value) => setNewRule({ ...newRule, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Products</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Clothing">Clothing</SelectItem>
                      <SelectItem value="Books">Books</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-type">Rule Type</Label>
                  <Select value={newRule.type} onValueChange={(value) => setNewRule({ ...newRule, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markup">Markup %</SelectItem>
                      <SelectItem value="discount">Discount %</SelectItem>
                      <SelectItem value="quantity_discount">Quantity Discount</SelectItem>
                      <SelectItem value="seasonal">Seasonal Pricing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value (%)</Label>
                <Input
                  type="number"
                  placeholder="Enter percentage"
                  value={newRule.value}
                  onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateRuleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRule}>Create Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Rule Dialog */}
        <Dialog open={isEditRuleOpen} onOpenChange={setIsEditRuleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pricing Rule</DialogTitle>
              <DialogDescription>Update pricing rule settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-rule-name">Rule Name</Label>
                <Input
                  placeholder="Enter rule name"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={newRule.category}
                    onValueChange={(value) => setNewRule({ ...newRule, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Products</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Clothing">Clothing</SelectItem>
                      <SelectItem value="Books">Books</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-rule-type">Rule Type</Label>
                  <Select value={newRule.type} onValueChange={(value) => setNewRule({ ...newRule, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markup">Markup %</SelectItem>
                      <SelectItem value="discount">Discount %</SelectItem>
                      <SelectItem value="quantity_discount">Quantity Discount</SelectItem>
                      <SelectItem value="seasonal">Seasonal Pricing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-value">Value (%)</Label>
                <Input
                  type="number"
                  placeholder="Enter percentage"
                  value={newRule.value}
                  onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditRuleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRule}>Update Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Margin</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32.5%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹1,25,000</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pricingRules.filter((r) => r.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Pricing rules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Changes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Pricing Rules</TabsTrigger>
          <TabsTrigger value="margins">Margin Analysis</TabsTrigger>
          <TabsTrigger value="competitive">Competitive Pricing</TabsTrigger>
          <TabsTrigger value="history">Price History</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Rules</CardTitle>
              <CardDescription>Automated pricing rules and strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search pricing rules..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">Rule ID</TableHead>
                        <TableHead className="min-w-[180px]">Name</TableHead>
                        <TableHead className="min-w-[120px]">Category</TableHead>
                        <TableHead className="min-w-[150px]">Type</TableHead>
                        <TableHead className="min-w-[80px]">Value</TableHead>
                        <TableHead className="min-w-[100px]">Products</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[150px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.id}</TableCell>
                      <TableCell>{rule.name}</TableCell>
                      <TableCell>{rule.category}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(rule.type)}>{rule.type.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>{rule.value}%</TableCell>
                      <TableCell>{rule.products} products</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            rule.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }
                        >
                          {rule.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditRule(rule)}>
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleApplyRule(rule.id)}>
                            <Play className="w-3 h-3 mr-1" />
                            Apply
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margins">
          <Card>
            <CardHeader>
              <CardTitle>Margin Analysis</CardTitle>
              <CardDescription>Analyze profit margins across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-600">Electronics</div>
                      <div className="text-2xl font-bold">28.5%</div>
                      <div className="text-xs text-green-600">+3.2% vs target</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-600">Clothing</div>
                      <div className="text-2xl font-bold">45.2%</div>
                      <div className="text-xs text-green-600">+8.1% vs target</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-600">Books</div>
                      <div className="text-2xl font-bold">22.8%</div>
                      <div className="text-xs text-red-600">-2.3% vs target</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitive">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Pricing</CardTitle>
              <CardDescription>Monitor competitor prices and market positioning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Competitive pricing analysis coming soon</p>
                <Button className="mt-4">Set up Price Monitoring</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Price History</CardTitle>
              <CardDescription>Track price changes over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Date</TableHead>
                          <TableHead className="min-w-[180px]">Product</TableHead>
                          <TableHead className="min-w-[100px]">Old Price</TableHead>
                          <TableHead className="min-w-[100px]">New Price</TableHead>
                          <TableHead className="min-w-[100px]">Change</TableHead>
                          <TableHead className="min-w-[200px]">Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>2024-01-15</TableCell>
                      <TableCell>iPhone 15</TableCell>
                      <TableCell>₹79,900</TableCell>
                      <TableCell>₹74,900</TableCell>
                      <TableCell className="text-red-600">-6.3%</TableCell>
                      <TableCell>Competitor pricing</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2024-01-14</TableCell>
                      <TableCell>Samsung TV 55"</TableCell>
                      <TableCell>₹45,000</TableCell>
                      <TableCell>₹48,000</TableCell>
                      <TableCell className="text-green-600">+6.7%</TableCell>
                      <TableCell>Markup rule applied</TableCell>
                    </TableRow>
                  </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
