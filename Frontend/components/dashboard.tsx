"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { DashboardHome } from "@/components/dashboard-home";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { getDefaultDashboardTab } from "@/lib/role-utils";

import { Customers } from "@/components/customers";
import { Reports } from "@/components/reports";
import { Settings } from "@/components/settings";
import { SalesHistory } from "@/components/sales-history";
import { EmployeeManagement } from "@/components/employee-management";
import { Categories } from "@/components/categories";
import { Promotions } from "@/components/promotions";
import { Expenses } from "@/components/expenses";
import { TaxManagement } from "@/components/tax-management";
import { PurchaseOrders } from "@/components/purchase-orders";
import { Returns } from "@/components/returns";
import { GiftCards } from "@/components/gift-cards";
import { Loyalty } from "@/components/loyalty";
import { Shifts } from "@/components/shifts";
import { Audit } from "@/components/audit";
import { Backup } from "@/components/backup";
import { Integrations } from "@/components/integrations";
import { MultiLocation } from "@/components/multi-location";
import { Reservations } from "@/components/reservations";
import { LayawayHolds } from "@/components/layaway-holds";
import { Pricing } from "@/components/pricing";
import { Branches } from "./branches";
import Inventory from "./inventory";
import { Stocks } from "./Stocks";
import { StockManagement } from "./StockManagement";
import {
  InventoryDashboard,
  Purchases,
  Transfers,
  StockOut,
  StockMovementLog,
  StockAdjustment,
  StockView,
  InventoryReports,
  InventoryAudit,
} from "./inventory/index";
import { Sales } from "./sales";
import Orders from "./orders";
import WebsiteOrders from "./website-orders";
import Subcategories from "./sub-categories";
import Units from "./Units";
import Suppliers from "./suppliers";
import Brands from "./Brands";
import Colors from "./color";
import Sizes from "./sizes";
import { Salaries } from "./Salaries";
import { Designation } from "./Designation";
import BarcodeGenerator from "./barcode-generator";
import { NewSale } from "./new-sale";
import { PrinterSettings } from "./printer-settings";
import { ProductExport } from "./product-export";


interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const preferredTab = getDefaultDashboardTab(localStorage.getItem("role"));

    if (preferredTab !== "dashboard") {
      setActiveTab(preferredTab);
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardHome onNavigate={setActiveTab} />;
      case "barcode-generator":
        return <BarcodeGenerator />;
      case "new-sale":
        return <NewSale />;
      case "orders":
        return <Orders />;
      case "website-orders":
        return <WebsiteOrders />;
      case "units":
        return <Units />;
      case "sales-history":
        return <SalesHistory />;
      case "brand":
        return <Brands />;
      case "colors":
        return <Colors />;
      case "sizes":
        return <Sizes />;
      case "returns":
        return <Returns />;
      case "reservations":
        return <Reservations />;
      case "layaway-holds":
        return <LayawayHolds />;
      case "inventory":
        return <Inventory />;
      case "categories":
        return <Categories />;
      case "sub-categories":
        return <Subcategories />;
      case "branches":
        return <Branches />;
      case "suppliers":
        return <Suppliers />;
      case "purchase-orders":
        return <PurchaseOrders />;
      case "pricing":
        return <Pricing />;
      case "customers":
        return <Customers />;
      case "loyalty":
        return <Stocks />;
      case "stock-management":
        return <StockManagement />;
      case "inventory-dashboard":
        return <InventoryDashboard onNavigate={setActiveTab} />;
      case "purchases":
        return <Purchases />;
      case "transfers":
        return <Transfers />;
      case "stock-out":
        return <StockOut />;
      case "stock-movement-log":
        return <StockMovementLog />;
      case "stock-adjustment":
        return <StockAdjustment />;
      case "stock-view":
        return <StockView />;
      case "inventory-reports":
        return <InventoryReports />;
      case "inventory-audit":
        return <InventoryAudit />;
      case "designation":
        return <Designation />;
      case "employees":
        return <EmployeeManagement />;
      case "shifts":
        return <Shifts />;
      case "salaries":
        return <Salaries />;
      case "promotions":
        return <Promotions />;
      case "expenses":
        return <Expenses />;
      case "tax-management":
        return <TaxManagement />;
      case "reports":
        return <Reports />;
      case "audit":
        return <Audit />;
      case "multi-location":
        return <MultiLocation />;
      case "integrations":
        return <Integrations />;
      case "backup":
        return <Backup />;
      case "settings":
        return <Settings />;
      case "printer-settings":
        return <PrinterSettings />;
      case "product-export":
        return <ProductExport />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-30">
        <Button
          variant="default"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <main className="flex-1 overflow-auto w-full pt-16 lg:pt-0">{renderContent()}</main>
    </div>
  );
}
