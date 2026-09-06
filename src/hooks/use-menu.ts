"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Category, MenuItem, Paginated } from "@/types/api";

function paginated<T>(payload: unknown): Paginated<T> {
  const root = (payload && typeof payload === "object" ? payload : {}) as {
    data?: unknown;
    pagination?: { count?: number; next?: string | null; previous?: string | null };
  };
  const envelope = "data" in root ? root.data : payload;
  const pagination = root.pagination;
  if (Array.isArray(envelope)) return { count: pagination?.count ?? envelope.length, next: normalizePageUrl(pagination?.next), previous: normalizePageUrl(pagination?.previous), results: envelope as T[] };
  const record = (envelope ?? {}) as { results?: T[]; count?: number; next?: string | null; previous?: string | null };
  return {
    count: pagination?.count ?? record.count ?? record.results?.length ?? 0,
    next: normalizePageUrl(pagination?.next ?? record.next),
    previous: normalizePageUrl(pagination?.previous ?? record.previous),
    results: Array.isArray(record.results) ? record.results : [],
  };
}

function normalizePageUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const basePath = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").pathname.replace(/\/$/, "");
    const url = new URL(value, typeof window === "undefined" ? "http://localhost" : window.location.origin);
    const path = url.pathname.startsWith(basePath) ? url.pathname.slice(basePath.length) : url.pathname;
    return `${path || "/"}${url.search}`;
  } catch {
    return value;
  }
}

export const menuKeys = {
  items: (params: URLSearchParams) => ["menu-items", params.toString()] as const,
  categories: ["categories"] as const,
};
export function useMenuItems(params: URLSearchParams) {
  return useInfiniteQuery({
    queryKey: menuKeys.items(params),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => paginated<MenuItem>((await api.get<Paginated<MenuItem> | MenuItem[]>(pageParam ?? "/menu-items/", pageParam ? undefined : { params })).data),
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
  });
}
export function useCategories() {
  return useInfiniteQuery({
    queryKey: menuKeys.categories,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => paginated<Category>((await api.get<Paginated<Category> | Category[]>(pageParam ?? "/categories/", pageParam ? undefined : { params: { ordering: "display_order" } })).data),
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
  });
}
function multipartConfig() {
  return { headers: { "Content-Type": "multipart/form-data" } };
}
export function useMenuMutations() {
  const client = useQueryClient();
  const invalidateItems = () =>
    client.invalidateQueries({ queryKey: ["menu-items"] });
  const invalidateCategories = () =>
    client.invalidateQueries({ queryKey: menuKeys.categories });
  return {
    create: useMutation({
      mutationFn: (data: FormData) =>
        api.post("/menu-items/", data, multipartConfig()),
      onSuccess: invalidateItems,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: number; data: FormData }) =>
        api.patch(`/menu-items/${id}/`, data, multipartConfig()),
      onSuccess: invalidateItems,
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.delete(`/menu-items/${id}/`),
      onSuccess: invalidateItems,
    }),
    toggle: useMutation({
      mutationFn: ({ id, available }: { id: number; available: boolean }) =>
        api.patch(`/menu-items/${id}/`, { available_for_customers: available }),
      onSuccess: invalidateItems,
    }),
    createCategory: useMutation({
      mutationFn: (data: { name: string; display_order: number }) =>
        api.post("/categories/", data),
      onSuccess: invalidateCategories,
    }),
    updateCategory: useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: number;
        data: { name: string; display_order: number };
      }) => api.patch(`/categories/${id}/`, data),
      onSuccess: invalidateCategories,
    }),
    removeCategory: useMutation({
      mutationFn: (id: number) => api.delete(`/categories/${id}/`),
      onSuccess: invalidateCategories,
    }),
  };
}
