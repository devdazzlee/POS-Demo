import { API_BASE } from "@/config/constants"
import apiClient from "./apiClient"

export async function loginRequest(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || res.statusText)
  }
  return res.json() as Promise<{
    success: true
    message: string
    data: { user: { email: string; role: string }; token: string , branch: string }
  }>
}

export async function getProducts(params?: any) {
  const res = await apiClient.get("/products", { params })
  return res.data
}

export async function createSale(saleData: any) {
  const res = await apiClient.post("/sale", saleData)
  return res.data
}

// asd  