"use client"

import { useState, useMemo, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Eye, CreditCard, Gift, DollarSign, Users, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PageLoader } from "@/components/ui/page-loader"

interface GiftCard {
  id: string
  code: string
  balance: number
  originalValue: number
  customer: string
  customerEmail?: string
  customerPhone?: string
  issueDate: string
  expiryDate: string
  status: "active" | "expired" | "used" | "suspended"
  lastUsed?: string
  message?: string
  issuedBy: string
  transactions: Transaction[]
}

interface Transaction {
  id: string
  type: "issue" | "reload" | "redeem" | "refund"
  amount: number
  date: string
  description: string
  balanceAfter: number
  location?: string
}

interface NewGiftCard {
  customer: string
  customerEmail: string
  customerPhone: string
  amount: string
  message: string
  expiryMonths: string
}

interface ReloadCard {
  cardCode: string
  amount: string
  notes: string
}

export function GiftCards() {
  const { toast } = useToast()
  const today = new Date().toISOString().split("T")[0]
  const [isLoading, setIsLoading] = useState(true)

  const [giftCards, setGiftCards] = useState<GiftCard[]>([
    {
      id: "GC-001",
      code: "GIFT2024001",
      balance: 5000,
      originalValue: 5000,
      customer: "John Doe",
      customerEmail: "john.doe@example.com",
      customerPhone: "+91 98765 43210",
      issueDate: "2024-01-15",
      expiryDate: "2025-01-15",
      status: "active",
      lastUsed: "2024-01-20",
      message: "Happy Birthday!",
      issuedBy: "Admin",
      transactions: [
        {
          id: "TXN-001",
          type: "issue",
          amount: 5000,
          date: "2024-01-15",
          description: "Gift card issued",
          balanceAfter: 5000,
        },
      ],
    },
    {
      id: "GC-002",
      code: "GIFT2024002",
      balance: 2500,
      originalValue: 5000,
      customer: "Jane Smith",
      customerEmail: "jane.smith@example.com",
      customerPhone: "+91 87654 32109",
      issueDate: "2024-01-14",
      expiryDate: "2025-01-14",
      status: "active",
      lastUsed: "2024-01-18",
      message: "Thank you for your business!",
      issuedBy: "Manager",
      transactions: [
        {
          id: "TXN-002",
          type: "issue",
          amount: 5000,
          date: "2024-01-14",
          description: "Gift card issued",
          balanceAfter: 5000,
        },
        {
          id: "TXN-003",
          type: "redeem",
          amount: 2500,
          date: "2024-01-18",
          description: "Purchase at Main Store",
          balanceAfter: 2500,
          location: "Main Store",
        },
      ],
    },
    {
      id: "GC-003",
      code: "GIFT2024003",
      balance: 0,
      originalValue: 3000,
      customer: "Mike Johnson",
      customerEmail: "mike.j@example.com",
      issueDate: "2024-01-10",
      expiryDate: "2025-01-10",
      status: "used",
      lastUsed: "2024-01-12",
      issuedBy: "Staff",
      transactions: [
        {
          id: "TXN-004",
          type: "issue",
          amount: 3000,
          date: "2024-01-10",
          description: "Gift card issued",
          balanceAfter: 3000,
        },
        {
          id: "TXN-005",
          type: "redeem",
          amount: 3000,
          date: "2024-01-12",
          description: "Full redemption at Online Store",
          balanceAfter: 0,
          location: "Online Store",
        },
      ],
    },
    {
      id: "GC-004",
      code: "GIFT2024004",
      balance: 1000,
      originalValue: 1000,
      customer: "Sarah Wilson",
      customerEmail: "sarah.w@example.com",
      issueDate: "2023-12-15",
      expiryDate: "2024-12-15",
      status: "expired",
      issuedBy: "Admin",
      transactions: [
        {
          id: "TXN-006",
          type: "issue",
          amount: 1000,
          date: "2023-12-15",
          description: "Gift card issued",
          balanceAfter: 1000,
        },
      ],
    },
  ])

  const [isIssueOpen, setIsIssueOpen] = useState(false)
  const [isReloadOpen, setIsReloadOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [newGiftCard, setNewGiftCard] = useState<NewGiftCard>({
    customer: "",
    customerEmail: "",
    customerPhone: "",
    amount: "",
    message: "",
    expiryMonths: "12",
  })

  const [reloadCard, setReloadCard] = useState<ReloadCard>({
    cardCode: "",
    amount: "",
    notes: "",
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      case "used":
        return "bg-gray-100 text-gray-800"
      case "suspended":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "issue":
        return "bg-blue-100 text-blue-800"
      case "reload":
        return "bg-green-100 text-green-800"
      case "redeem":
        return "bg-orange-100 text-orange-800"
      case "refund":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredCards = useMemo(() => {
    return giftCards.filter((card) => {
      const matchesSearch =
        card.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })
  }, [giftCards, searchTerm])

  const getFilteredCardsByStatus = (status: string) => {
    if (status === "all") return filteredCards
    return filteredCards.filter((card) => card.status === status)
  }

  // Calculate stats
  const activeCards = giftCards.filter((c) => c.status === "active").length
  const totalValue = giftCards.filter((c) => c.status === "active").reduce((sum, c) => sum + c.balance, 0)
  const redeemedToday = giftCards
    .flatMap((c) => c.transactions)
    .filter((t) => t.type === "redeem" && t.date === today)
    .reduce((sum, t) => sum + t.amount, 0)
  const newCardsToday = giftCards.filter((c) => c.issueDate === today).length

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const generateCardId = () => {
    const nextId = giftCards.length + 1
    return `GC-${nextId.toString().padStart(3, "0")}`
  }

  const generateCardCode = () => {
    const year = new Date().getFullYear()
    const nextId = giftCards.length + 1
    return `GIFT${year}${nextId.toString().padStart(3, "0")}`
  }

  const generateTransactionId = () => {
    const allTransactions = giftCards.flatMap((c) => c.transactions)
    const nextId = allTransactions.length + 1
    return `TXN-${nextId.toString().padStart(3, "0")}`
  }

  const resetIssueForm = () => {
    setNewGiftCard({
      customer: "",
      customerEmail: "",
      customerPhone: "",
      amount: "",
      message: "",
      expiryMonths: "12",
    })
  }

  const resetReloadForm = () => {
    setReloadCard({
      cardCode: "",
      amount: "",
      notes: "",
    })
  }

  const handleIssueCard = () => {
    if (!newGiftCard.customer || !newGiftCard.amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in customer name and amount.",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(newGiftCard.amount)
    if (amount <= 0 || amount > 100000) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be between ₹1 and ₹100,000.",
        variant: "destructive",
      })
      return
    }

    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + Number.parseInt(newGiftCard.expiryMonths))

    const card: GiftCard = {
      id: generateCardId(),
      code: generateCardCode(),
      balance: amount,
      originalValue: amount,
      customer: newGiftCard.customer,
      customerEmail: newGiftCard.customerEmail || undefined,
      customerPhone: newGiftCard.customerPhone || undefined,
      issueDate: today,
      expiryDate: expiryDate.toISOString().split("T")[0],
      status: "active",
      message: newGiftCard.message || undefined,
      issuedBy: "Current User",
      transactions: [
        {
          id: generateTransactionId(),
          type: "issue",
          amount: amount,
          date: today,
          description: "Gift card issued",
          balanceAfter: amount,
        },
      ],
    }

    setGiftCards((prev) => [card, ...prev])
    resetIssueForm()
    setIsIssueOpen(false)

    toast({
      title: "Gift Card Issued",
      description: `Gift card ${card.code} has been issued successfully.`,
    })
  }

  const handleReloadCard = () => {
    if (!reloadCard.cardCode || !reloadCard.amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in card code and reload amount.",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(reloadCard.amount)
    if (amount <= 0 || amount > 50000) {
      toast({
        title: "Invalid Amount",
        description: "Reload amount must be between ₹1 and ₹50,000.",
        variant: "destructive",
      })
      return
    }

    const cardIndex = giftCards.findIndex((c) => c.code === reloadCard.cardCode)
    if (cardIndex === -1) {
      toast({
        title: "Card Not Found",
        description: "Gift card with this code was not found.",
        variant: "destructive",
      })
      return
    }

    const card = giftCards[cardIndex]
    if (card.status !== "active") {
      toast({
        title: "Invalid Card Status",
        description: "Only active cards can be reloaded.",
        variant: "destructive",
      })
      return
    }

    const newBalance = card.balance + amount
    const transaction: Transaction = {
      id: generateTransactionId(),
      type: "reload",
      amount: amount,
      date: today,
      description: reloadCard.notes || "Card reloaded",
      balanceAfter: newBalance,
    }

    const updatedCard = {
      ...card,
      balance: newBalance,
      transactions: [...card.transactions, transaction],
    }

    setGiftCards((prev) => prev.map((c, index) => (index === cardIndex ? updatedCard : c)))
    resetReloadForm()
    setIsReloadOpen(false)

    toast({
      title: "Card Reloaded",
      description: `₹${amount.toLocaleString()} has been added to card ${card.code}.`,
    })
  }

  const handleViewCard = (card: GiftCard) => {
    setSelectedCard(card)
    setIsViewOpen(true)
  }

  const handleSuspendCard = (cardId: string) => {
    setGiftCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, status: "suspended" as const } : card)))

    toast({
      title: "Card Suspended",
      description: `Gift card has been suspended.`,
    })
  }

  const handleActivateCard = (cardId: string) => {
    setGiftCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, status: "active" as const } : card)))

    toast({
      title: "Card Activated",
      description: `Gift card has been activated.`,
    })
  }

  const handlePrintCard = (card: GiftCard) => {
    // Generate gift card document
    const cardContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Gift Card - ${card.code}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px;
            background-color: #f5f5f5;
        }
        .gift-card {
            width: 400px;
            height: 250px;
            margin: 0 auto;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            padding: 20px;
            color: white;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .card-header {
            text-align: center;
            margin-bottom: 20px;
        }
        .card-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .card-subtitle {
            font-size: 14px;
            opacity: 0.9;
        }
        .card-code {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            background: rgba(255,255,255,0.2);
            padding: 10px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .card-amount {
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
        }
        .card-details {
            font-size: 12px;
            opacity: 0.9;
        }
        .card-message {
            background: rgba(255,255,255,0.1);
            padding: 10px;
            border-radius: 8px;
            margin-top: 15px;
            font-style: italic;
            text-align: center;
        }
        .card-footer {
            position: absolute;
            bottom: 15px;
            left: 20px;
            right: 20px;
            font-size: 10px;
            opacity: 0.8;
            text-align: center;
        }
        .print-info {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="gift-card">
        <div class="card-header">
            <div class="card-title">GIFT CARD</div>
            <div class="card-subtitle">Your Store Name</div>
        </div>
        
        <div class="card-code">${card.code}</div>
        
        <div class="card-amount">₹${card.balance.toLocaleString()}</div>
        
        <div class="card-details">
            <div>To: ${card.customer}</div>
            <div>Valid until: ${card.expiryDate}</div>
        </div>
        
        ${card.message
        ? `
        <div class="card-message">
            "${card.message}"
        </div>
        `
        : ""
      }
        
        <div class="card-footer">
            Terms and conditions apply. Not redeemable for cash.
        </div>
    </div>
    
    <div class="print-info">
        <p><strong>Gift Card Details</strong></p>
        <p>Card Code: ${card.code}</p>
        <p>Current Balance: ₹${card.balance.toLocaleString()}</p>
        <p>Original Value: ₹${card.originalValue.toLocaleString()}</p>
        <p>Issue Date: ${card.issueDate}</p>
        <p>Expiry Date: ${card.expiryDate}</p>
        <p>Status: ${card.status.toUpperCase()}</p>
        <p>Issued by: ${card.issuedBy}</p>
        <p style="margin-top: 20px; font-size: 10px;">
            Generated on: ${new Date().toLocaleString()}
        </p>
    </div>
</body>
</html>`

    // Create blob and download
    const blob = new Blob([cardContent], { type: "text/html" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `gift-card-${card.code}.html`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Also open in new window for printing
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(cardContent)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }

    toast({
      title: "Gift Card Printed",
      description: `Gift card ${card.code} has been generated for printing.`,
    })
  }

  if (isLoading) {
    return <PageLoader message="Loading gift cards..." />
  }

  if (isLoading) {
    return <PageLoader message="Loading gift cards..." />
  }

  const renderCardsTable = (cardsData: GiftCard[]) => (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <div className="inline-block min-w-full align-middle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">Card ID</TableHead>
              <TableHead className="min-w-[130px]">Code</TableHead>
              <TableHead className="min-w-[150px]">Customer</TableHead>
              <TableHead className="min-w-[120px]">Original Value</TableHead>
              <TableHead className="min-w-[130px]">Current Balance</TableHead>
              <TableHead className="min-w-[120px]">Issue Date</TableHead>
              <TableHead className="min-w-[120px]">Expiry Date</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
      <TableBody>
        {cardsData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
              No gift cards found
            </TableCell>
          </TableRow>
        ) : (
          cardsData.map((card) => (
            <TableRow key={card.id}>
              <TableCell className="font-medium">{card.id}</TableCell>
              <TableCell className="font-mono">{card.code}</TableCell>
              <TableCell>{card.customer}</TableCell>
              <TableCell>₹{card.originalValue.toLocaleString()}</TableCell>
              <TableCell>₹{card.balance.toLocaleString()}</TableCell>
              <TableCell>{card.issueDate}</TableCell>
              <TableCell>{card.expiryDate}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(card.status)}>{card.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewCard(card)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {card.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReloadCard((prev) => ({ ...prev, cardCode: card.code }))
                        setIsReloadOpen(true)
                      }}
                    >
                      Reload
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handlePrintCard(card)}>
                    <Printer className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Gift Cards</h1>
          <p className="text-sm md:text-base text-gray-600">Manage gift card issuance and transactions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isReloadOpen} onOpenChange={setIsReloadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Reload Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reload Gift Card</DialogTitle>
                <DialogDescription>Add value to an existing gift card</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-code">Gift Card Code *</Label>
                  <Input
                    id="card-code"
                    placeholder="Enter gift card code"
                    value={reloadCard.cardCode}
                    onChange={(e) => setReloadCard((prev) => ({ ...prev, cardCode: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reload-amount">Reload Amount *</Label>
                  <Input
                    id="reload-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={reloadCard.amount}
                    onChange={(e) => setReloadCard((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reload-notes">Notes</Label>
                  <Input
                    id="reload-notes"
                    placeholder="Optional notes"
                    value={reloadCard.notes}
                    onChange={(e) => setReloadCard((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsReloadOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleReloadCard}>Reload Card</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
            <DialogTrigger asChild>
              <Button>
                <Gift className="w-4 h-4 mr-2" />
                Issue Gift Card
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Issue New Gift Card</DialogTitle>
                <DialogDescription>Create a new gift card for a customer</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-name">Customer Name *</Label>
                    <Input
                      id="customer-name"
                      placeholder="Enter customer name"
                      value={newGiftCard.customer}
                      onChange={(e) => setNewGiftCard((prev) => ({ ...prev, customer: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-email">Email</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      placeholder="customer@example.com"
                      value={newGiftCard.customerEmail}
                      onChange={(e) => setNewGiftCard((prev) => ({ ...prev, customerEmail: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-phone">Phone</Label>
                    <Input
                      id="customer-phone"
                      placeholder="+91 98765 43210"
                      value={newGiftCard.customerPhone}
                      onChange={(e) => setNewGiftCard((prev) => ({ ...prev, customerPhone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Gift Card Value *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={newGiftCard.amount}
                      onChange={(e) => setNewGiftCard((prev) => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry-months">Validity Period</Label>
                  <Select
                    value={newGiftCard.expiryMonths}
                    onValueChange={(value) => setNewGiftCard((prev) => ({ ...prev, expiryMonths: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select validity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                      <SelectItem value="18">18 Months</SelectItem>
                      <SelectItem value="24">24 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Gift message"
                    value={newGiftCard.message}
                    onChange={(e) => setNewGiftCard((prev) => ({ ...prev, message: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsIssueOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleIssueCard}>Issue Card</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCards}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redeemed Today</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{redeemedToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Today's redemptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Cards</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newCardsToday}</div>
            <p className="text-xs text-muted-foreground">Issued today</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Cards ({filteredCards.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({getFilteredCardsByStatus("active").length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({getFilteredCardsByStatus("expired").length})</TabsTrigger>
          <TabsTrigger value="used">Fully Used ({getFilteredCardsByStatus("used").length})</TabsTrigger>
        </TabsList>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search gift cards..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Gift Cards</CardTitle>
              <CardDescription>Manage all gift cards and their transactions</CardDescription>
            </CardHeader>
            <CardContent>{renderCardsTable(getFilteredCardsByStatus("all"))}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Gift Cards</CardTitle>
              <CardDescription>Currently active gift cards with remaining balance</CardDescription>
            </CardHeader>
            <CardContent>{renderCardsTable(getFilteredCardsByStatus("active"))}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <CardTitle>Expired Gift Cards</CardTitle>
              <CardDescription>Gift cards that have passed their expiry date</CardDescription>
            </CardHeader>
            <CardContent>{renderCardsTable(getFilteredCardsByStatus("expired"))}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="used">
          <Card>
            <CardHeader>
              <CardTitle>Fully Used Gift Cards</CardTitle>
              <CardDescription>Gift cards with zero balance</CardDescription>
            </CardHeader>
            <CardContent>{renderCardsTable(getFilteredCardsByStatus("used"))}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Card Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Gift Card Details - {selectedCard?.code}</DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Card Information</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>Card ID:</strong> {selectedCard.id}
                    </div>
                    <div>
                      <strong>Code:</strong> <span className="font-mono">{selectedCard.code}</span>
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      <Badge className={getStatusColor(selectedCard.status)}>{selectedCard.status}</Badge>
                    </div>
                    <div>
                      <strong>Issue Date:</strong> {selectedCard.issueDate}
                    </div>
                    <div>
                      <strong>Expiry Date:</strong> {selectedCard.expiryDate}
                    </div>
                    <div>
                      <strong>Issued By:</strong> {selectedCard.issuedBy}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Customer Information</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>Name:</strong> {selectedCard.customer}
                    </div>
                    {selectedCard.customerEmail && (
                      <div>
                        <strong>Email:</strong> {selectedCard.customerEmail}
                      </div>
                    )}
                    {selectedCard.customerPhone && (
                      <div>
                        <strong>Phone:</strong> {selectedCard.customerPhone}
                      </div>
                    )}
                    {selectedCard.lastUsed && (
                      <div>
                        <strong>Last Used:</strong> {selectedCard.lastUsed}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Balance Information</h3>
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Original Value</div>
                      <div className="text-xl font-bold">₹{selectedCard.originalValue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Current Balance</div>
                      <div className="text-xl font-bold text-green-600">₹{selectedCard.balance.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm text-gray-500">Amount Used</div>
                    <div className="text-lg font-medium text-red-600">
                      ₹{(selectedCard.originalValue - selectedCard.balance).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {selectedCard.message && (
                <div>
                  <h3 className="font-medium mb-2">Gift Message</h3>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm italic">"{selectedCard.message}"</div>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">Transaction History</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Balance After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCard.transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>
                            <Badge className={getTransactionTypeColor(transaction.type)}>{transaction.type}</Badge>
                          </TableCell>
                          <TableCell className={transaction.type === "redeem" ? "text-red-600" : "text-green-600"}>
                            {transaction.type === "redeem" ? "-" : "+"}₹{transaction.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>₹{transaction.balanceAfter.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t">
                {selectedCard.status === "active" && (
                  <>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setReloadCard((prev) => ({ ...prev, cardCode: selectedCard.code }))
                        setIsViewOpen(false)
                        setIsReloadOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Reload Card
                    </Button>
                    <Button variant="outline" onClick={() => handleSuspendCard(selectedCard.id)}>
                      Suspend
                    </Button>
                  </>
                )}
                {selectedCard.status === "suspended" && (
                  <Button className="flex-1" onClick={() => handleActivateCard(selectedCard.id)}>
                    Activate Card
                  </Button>
                )}
                <Button variant="outline" onClick={() => handlePrintCard(selectedCard)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Card
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
