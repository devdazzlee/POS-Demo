"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Loader2,
  Edit,
  Eye,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { API_BASE } from "@/config/constants";
import { PageLoader } from "@/components/ui/page-loader";

interface Subcategory {
  id: string;
  code: string;
  name: string;
  image?: string;
  display_on_pos: boolean;
  is_active: boolean;
  product_count: number;
  created_at: string;
}

const Subcategories: React.FC = () => {
  const [list, setList] = useState<Subcategory[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState<Subcategory | null>(null);

  // form.image now holds base64 string or URL
  const [form, setForm] = useState({
    name: "",
    display_on_pos: true,
    image: "",
  });

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async (q: string = search) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`${API_BASE}/subcategories`, {
        params: { search: q },
      });
      setList(res.data.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    try {
      const res = await apiClient.get(`${API_BASE}/subcategories/${id}`);
      setCurrent(res.data.data);
      setDetailOpen(true);
    } catch (e) {
      console.log(e);
    }
  };

  const openAdd = () => {
    setForm({ name: "", display_on_pos: true, image: "" });
    setAddOpen(true);
  };
  const openEdit = (sub: Subcategory) => {
    setCurrent(sub);
    setForm({
      name: sub.name,
      display_on_pos: sub.display_on_pos,
      image: sub.image || "",
    });
    setEditOpen(true);
  };

  // Read file into base64 string
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setForm((f) => ({ ...f, image: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const submitForm = async (id?: string) => {
    if (!form.name.trim()) {
      alert("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        display_on_pos: form.display_on_pos,
        image: form.image, // as base64 or URL string
      };
      if (id) {
        await apiClient.patch(`${API_BASE}/subcategories/${id}`, payload);
      } else {
        await apiClient.post(`${API_BASE}/subcategories`, payload);
      }
      setAddOpen(false);
      setEditOpen(false);
      fetchList();
    } catch (e) {
      console.log(e);
      alert("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await apiClient.patch(`${API_BASE}/subcategories/${id}/toggle-status`);
      fetchList();
    } catch (e) {
      console.log(e);
    }
  };

  const handleSearchChange = (v: string) => {
    setSearch(v);
    fetchList(v);
  };

  if (isInitialLoading) {
    return <PageLoader message="Loading subcategories..." />
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Subcategories</h1>
          <p className="text-sm md:text-base text-gray-600">Manage product subcategories</p>
        </div>
        <Button
          onClick={openAdd}
          className="flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New</span>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by name or code"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PageLoader message="Loading subcategories..." />
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Code</TableHead>
                      <TableHead className="min-w-[150px]">Name</TableHead>
                      <TableHead className="min-w-[80px]">POS</TableHead>
                      <TableHead className="min-w-[100px]">Count</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {list.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-gray-50">
                    <TableCell>{sub.code}</TableCell>
                    <TableCell>{sub.name}</TableCell>
                    <TableCell>{sub.display_on_pos ? "Yes" : "No"}</TableCell>
                    <TableCell>{sub.product_count}</TableCell>
                    <TableCell>
                      {sub.is_active ? (
                        <ToggleRight className="text-green-500" />
                      ) : (
                        <ToggleLeft className="text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchDetail(sub.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(sub)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatus(sub.id)}
                      >
                        {sub.is_active ? "Disable" : "Enable"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Subcategory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            {/* <div>
              <Label htmlFor="image">Image File</Label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div> */}
            <div className="flex items-center space-x-2">
              <input
                id="pos"
                type="checkbox"
                checked={form.display_on_pos}
                onChange={(e) =>
                  setForm({ ...form, display_on_pos: e.target.checked })
                }
              />
              <Label htmlFor="pos">Display on POS</Label>
            </div>
            <Button
              onClick={() => submitForm()}
              className="w-full"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="animate-spin" /> : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={() => setEditOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Subcategory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ename">Name</Label>
              <Input
                id="ename"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="eimage">Image File</Label>
              <input
                type="file"
                id="eimage"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="epos"
                type="checkbox"
                checked={form.display_on_pos}
                onChange={(e) =>
                  setForm({ ...form, display_on_pos: e.target.checked })
                }
              />
              <Label htmlFor="epos">Display on POS</Label>
            </div>
            <Button
              onClick={() => submitForm(current?.id)}
              className="w-full"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="animate-spin" /> : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={() => setDetailOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subcategory Details</DialogTitle>
          </DialogHeader>
          {current && (
            <div className="space-y-2">
              <p>
                <strong>Code:</strong> {current.code}
              </p>
              <p>
                <strong>Name:</strong> {current.name}
              </p>
              <p>
                <strong>Display on POS:</strong>{" "}
                {current.display_on_pos ? "Yes" : "No"}
              </p>
              <p>
                <strong>Products:</strong> {current.product_count}
              </p>
              {current.image && (
                <img
                  src={current.image}
                  alt={current.name}
                  className="w-full h-32 object-cover rounded"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subcategories;
