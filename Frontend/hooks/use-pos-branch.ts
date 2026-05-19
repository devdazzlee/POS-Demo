"use client";

import { useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/apiClient";
import {
  BranchOption,
  isAdminRole,
  mapBranchOption,
  normalizeBranchId,
} from "@/lib/branch-utils";

interface BranchInfo {
  name: string;
  address: string;
}

export function usePosBranch() {
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [branchInfo, setBranchInfo] = useState<BranchInfo>({ name: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initializeBranch = async () => {
      if (typeof window === "undefined") return;

      setLoading(true);

      try {
        const role = localStorage.getItem("role");
        const isAdmin = isAdminRole(role);
        const storedBranchId = normalizeBranchId(localStorage.getItem("branch"));

        if (!cancelled) {
          setAdminMode(isAdmin);
        }

        if (isAdmin) {
          const response = await apiClient.get("/branches", {
            params: { fetch_all: true },
          });
          const rawBranches = Array.isArray(response?.data?.data) ? response.data.data : [];
          const activeBranches = rawBranches
            .map(mapBranchOption)
            .filter((branch: BranchOption) => branch.id && branch.is_active !== false);

          if (cancelled) return;

          setBranches(activeBranches);

          const initialBranch =
            activeBranches.find((branch: BranchOption) => branch.id === storedBranchId) ||
            activeBranches[0] ||
            null;

          if (initialBranch) {
            setSelectedBranchId(initialBranch.id);
            setBranchInfo({
              name: initialBranch.name,
              address: initialBranch.address || "",
            });
          } else {
            setSelectedBranchId("");
            setBranchInfo({ name: "Admin", address: "" });
          }

          return;
        }

        if (!storedBranchId) {
          if (!cancelled) {
            setSelectedBranchId("");
            setBranchInfo({ name: "", address: "" });
          }
          return;
        }

        if (!cancelled) {
          setSelectedBranchId(storedBranchId);
        }

        const response = await apiClient.get(`/branches/${storedBranchId}`);
        const branch = response?.data?.data ? mapBranchOption(response.data.data) : null;

        if (cancelled || !branch) return;

        setBranchInfo({
          name: branch.name,
          address: branch.address || "",
        });
      } catch (error) {
        if (!cancelled) {
          setBranchInfo((prev) => (prev.name ? prev : { name: "Admin", address: "" }));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeBranch();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!adminMode) return;

    const selectedBranch = branches.find(
      (branch: BranchOption) => branch.id === selectedBranchId
    );
    if (!selectedBranch) return;

    setBranchInfo({
      name: selectedBranch.name,
      address: selectedBranch.address || "",
    });
  }, [adminMode, branches, selectedBranchId]);

  const selectedBranch = useMemo(
    () =>
      branches.find((branch: BranchOption) => branch.id === selectedBranchId) || null,
    [branches, selectedBranchId]
  );

  return {
    adminMode,
    branchLoading: loading,
    branches,
    selectedBranch,
    selectedBranchId,
    setSelectedBranchId,
    branchInfo,
    hasBranch: Boolean(selectedBranchId),
  };
}
