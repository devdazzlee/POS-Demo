"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plug, Zap, Globe, CreditCard, Truck, Mail } from "lucide-react"

export function Integrations() {
  const [integrations, setIntegrations] = useState([
    {
      id: "payment-gateway",
      name: "Payment Gateway",
      description: "Accept online payments",
      icon: CreditCard,
      status: "connected",
      provider: "Razorpay",
    },
    {
      id: "email-service",
      name: "Email Service",
      description: "Send automated emails",
      icon: Mail,
      status: "connected",
      provider: "SendGrid",
    },
    {
      id: "shipping",
      name: "Shipping Service",
      description: "Manage deliveries",
      icon: Truck,
      status: "disconnected",
      provider: "Delhivery",
    },
    {
      id: "accounting",
      name: "Accounting Software",
      description: "Sync financial data",
      icon: Globe,
      status: "disconnected",
      provider: "Tally",
    },
  ])

  const getStatusColor = (status: string) => {
    return status === "connected" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Integrations</h1>
          <p className="text-gray-600">Connect with third-party services and APIs</p>
        </div>
        <Button>
          <Plug className="w-4 h-4 mr-2" />
          Browse Integrations
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Active integrations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Ready to connect</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Healthy</div>
            <p className="text-xs text-muted-foreground">All systems sync</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="connected" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connected">Connected</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="connected">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.map((integration) => {
              const IconComponent = integration.icon
              return (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-8 w-8 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription>{integration.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(integration.status)}>{integration.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Provider: {integration.provider}</span>
                        <Switch checked={integration.status === "connected"} onCheckedChange={() => {}} />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Configure
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Test
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="available">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Globe className="h-8 w-8 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">E-commerce Platform</CardTitle>
                    <CardDescription>Sync with online stores</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Connect</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-8 w-8 text-green-600" />
                  <div>
                    <CardTitle className="text-lg">Banking API</CardTitle>
                    <CardDescription>Connect bank accounts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Connect</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Truck className="h-8 w-8 text-purple-600" />
                  <div>
                    <CardTitle className="text-lg">Inventory Management</CardTitle>
                    <CardDescription>Sync inventory data</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Connect</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
