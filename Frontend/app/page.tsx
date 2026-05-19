"use client";

import { useState, useEffect } from "react";
import { LoginForm } from "@/components/login-form";
import { Dashboard } from "@/components/dashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    
    // Log branch information if already logged in
    if (storedToken) {
      const branchName = localStorage.getItem("branchName");
      const branchAddress = localStorage.getItem("branchAddress");
      const branchId = localStorage.getItem("branch");
      const userRole = localStorage.getItem("role");
      
      if (branchName) {
        console.log("🏢 Current Branch:", branchName);
        console.log("📍 Branch Address:", branchAddress || "N/A");
        console.log("🆔 Branch ID:", branchId);
        console.log("👤 User Role:", userRole);
      } else if (branchId && branchId !== "Not Found" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
        // Fetch branch name if not in localStorage (skip for admin users)
        (async () => {
          try {
            const apiClient = (await import("@/lib/apiClient")).default;
            const branchResponse = await apiClient.get(`/branches/${branchId}`);
            const name = branchResponse.data?.data?.name || "Unknown Branch";
            const address = branchResponse.data?.data?.address || "";
            
            console.log("🏢 Current Branch:", name);
            console.log("📍 Branch Address:", address || "N/A");
            console.log("🆔 Branch ID:", branchId);
            console.log("👤 User Role:", userRole);
            
            localStorage.setItem("branchName", name);
            localStorage.setItem("branchAddress", address);
          } catch (error) {
            console.log("🏢 Branch ID:", branchId);
            console.log("👤 User Role:", userRole);
          }
        })();
      } else {
        console.log("🏢 No branch assigned (Admin user)");
        console.log("👤 User Role:", userRole);
      }
    }
    
    setChecking(false);
  }, []);

  const handleLogin = async (
    jwt: string,
    _branch: string, // you can ignore/remove this param
    user: { email: string; role: string; branch_id: string | null }
  ) => {
    console.log("🔐 Login Data:", { jwt, _branch, user });
    localStorage.setItem("token", jwt);
    localStorage.setItem("branch", user.branch_id ?? "Not Found");
    localStorage.setItem("role", user.role);
    setToken(jwt);

    // Fetch and log branch name
    if (user.branch_id && user.branch_id !== "Not Found") {
      try {
        const apiClient = (await import("@/lib/apiClient")).default;
        const branchResponse = await apiClient.get(`/branches/${user.branch_id}`);
        const branchName = branchResponse.data?.data?.name || "Unknown Branch";
        const branchAddress = branchResponse.data?.data?.address || "";
        
        console.log("🏢 Logged in from Branch:", branchName);
        console.log("📍 Branch Address:", branchAddress);
        console.log("👤 User Role:", user.role);
        console.log("📧 User Email:", user.email);
        
        // Store branch name for easy access
        localStorage.setItem("branchName", branchName);
        localStorage.setItem("branchAddress", branchAddress);
      } catch (error) {
        console.error("❌ Failed to fetch branch details:", error);
        console.log("🏢 Branch ID:", user.branch_id);
      }
    } else {
      console.log("🏢 No branch assigned (Admin user)");
    }
  };

  const handleLogout = async () => {
    try {
      const apiClient = (await import("@/lib/apiClient")).default;
      await apiClient.post("/auth/logout");
    } catch {
      // Proceed with local cleanup even if backend call fails
    }
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("branch");
    localStorage.removeItem("branchName");
    localStorage.removeItem("branchAddress");
    setToken(null);
  };
  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner className="w-12 h-12" />
      </div>
    );
  }
  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}
