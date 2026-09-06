"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Clock3,
  Download,
  Edit3,
  ImagePlus,
  Plus,
  Printer,
  QrCode,
  Search,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCategories,
  useMenuItems,
  useMenuMutations,
} from "@/hooks/use-menu";
import api from "@/lib/api";
import { currency } from "@/lib/utils";
import type { Category, MenuItem } from "@/types/api";
import "./menu.css";

const dishSchema = z.object({
  dish_name: z.string().min(1, "Dish name is required").max(200),
  category: z.coerce.number().int().positive("Choose a category"),
  price: z.string().regex(/^\d{0,8}(\.\d{0,2})?$/, "Use a valid price"),
  unit_cost: z.string().regex(/^\d{0,8}(\.\d{0,2})?$/, "Use a valid unit cost"),
  discount: z.string().regex(/^\d{0,3}(\.\d{0,2})?$/, "Use a valid discount"),
  wait_time_minutes: z.coerce
    .number()
    .int()
    .min(1, "Wait time must be at least 1 minute"),
  ingredients: z.string(),
  available_for_customers: z.boolean(),
});
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(120),
  display_order: z.coerce.number().int().min(0),
});
type DishValues = z.infer<typeof dishSchema>;
type CategoryValues = z.infer<typeof categorySchema>;
type DishFormInput = z.input<typeof dishSchema>;
type CategoryFormInput = z.input<typeof categorySchema>;

function numericInput(event: React.FormEvent<HTMLInputElement>, decimals = 2) {
  const input = event.currentTarget;
  const value = input.value.replace(/[^0-9.]/g, "");
  const parts = value.split(".");
  input.value = decimals === 0
    ? parts[0]
    : parts.length > 1
      ? `${parts[0]}.${parts.slice(1).join("").slice(0, decimals)}`
      : parts[0];
}

export default function MenuPage() {
  const [tab, setTab] = useState<"items" | "categories">("items");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [available, setAvailable] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [dishDialog, setDishDialog] = useState<{
    open: boolean;
    item?: MenuItem;
  }>({ open: false });
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    category?: Category;
  }>({ open: false });
  const [confirmDialog, setConfirmDialog] = useState<{ type: "dish" | "category"; id: number; name: string } | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo(() => {
    const value = new URLSearchParams({ ordering });
    if (debouncedSearch) value.set("search", debouncedSearch);
    if (category) value.set("category", category);
    if (available) value.set("available", available);
    return value;
  }, [available, category, debouncedSearch, ordering]);

  const itemsQuery = useMenuItems(params);
  const categoriesQuery = useCategories();
  const mutations = useMenuMutations();
  const items = (itemsQuery.data?.pages.flatMap((page) => page.results) ?? []).filter((item) => !category || String(item.category) === category);
  const categories = categoriesQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const itemCount = itemsQuery.data?.pages[0]?.count ?? 0;
  const categoryCount = categoriesQuery.data?.pages[0]?.count ?? 0;
  const hasMoreItems = Boolean(itemsQuery.hasNextPage);
  const hasMoreCategories = Boolean(categoriesQuery.hasNextPage);
  const hasActiveFilters = Boolean(search || category || available || ordering !== "-created_at");

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setCategory("");
    setAvailable("");
    setOrdering("-created_at");
  }

  async function saveDish(
    values: DishValues,
    image: File | null,
    existing?: MenuItem,
  ) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) =>
      formData.append(key, String(value)),
    );
    if (image) formData.append("image", image);
    try {
      if (existing)
        await mutations.update.mutateAsync({ id: existing.id, data: formData });
      else await mutations.create.mutateAsync(formData);
      toast.success(existing ? "Dish updated" : "Dish created");
      setDishDialog({ open: false });
    } catch {
      toast.error("The dish could not be saved");
    }
  }

  async function saveCategory(values: CategoryValues, existing?: Category) {
    try {
      if (existing)
        await mutations.updateCategory.mutateAsync({
          id: existing.id,
          data: values,
        });
      else await mutations.createCategory.mutateAsync(values);
      toast.success(existing ? "Category updated" : "Category created");
      setCategoryDialog({ open: false });
    } catch {
      toast.error("The category could not be saved");
    }
  }

  async function confirmDelete() {
    if (!confirmDialog) return;
    try {
      if (confirmDialog.type === "dish") await mutations.remove.mutateAsync(confirmDialog.id);
      else await mutations.removeCategory.mutateAsync(confirmDialog.id);
      toast.success(`${confirmDialog.type === "dish" ? "Dish" : "Category"} deleted`);
      setConfirmDialog(null);
    } catch {
      toast.error(`${confirmDialog.type === "dish" ? "Dish" : "Category"} could not be deleted`);
    }
  }

  return (
    <>
      <main className="content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Catalog</p>
            <h1>Menu</h1>
            <p className="muted">
              Manage the dishes and categories served by Mountain Cafe.
            </p>
          </div>
          <div className="heading-actions">
            <button className="outline-button" onClick={() => setQrOpen(true)}>
              <QrCode size={16} /> Menu QR
            </button>
            <button
              className="soft-button"
              onClick={() => setDishDialog({ open: true })}
            >
              <Plus size={16} /> Add Dish
            </button>
          </div>
        </div>
        <div className="tabs">
          <button
            className={`tab ${tab === "items" ? "active" : ""}`}
            onClick={() => setTab("items")}
          >
            Menu Items {itemCount ? `(${itemCount})` : ""}
          </button>
          <button
            className={`tab ${tab === "categories" ? "active" : ""}`}
            onClick={() => setTab("categories")}
          >
            Categories{" "}
            {categoryCount ? `(${categoryCount})` : ""}
          </button>
        </div>
        {tab === "items" ? (
          <>
            <div className="toolbar">
              <div className="search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search dishes..."
                />
              </div>
              <select
                className="filter"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">{categoriesQuery.isError ? "Categories unavailable" : categories.length ? "All categories" : "No categories yet"}</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <div className="filter-toggle" role="group" aria-label="Availability filter">
                <button className={!available ? "active" : ""} onClick={() => setAvailable("")}>All</button>
                <button className={available === "true" ? "active" : ""} onClick={() => setAvailable("true")}>Available</button>
                <button className={available === "false" ? "active" : ""} onClick={() => setAvailable("false")}>Hidden</button>
              </div>
              <select
                className="filter"
                value={ordering}
                onChange={(event) => setOrdering(event.target.value)}
              >
                <option value="-created_at">Newest</option>
                <option value="created_at">Oldest</option>
                <option value="price">Price</option>
                <option value="dish_name">Name</option>
              </select>
            </div>
            <div className="clear-filters-row">
              <button className="clear-filters-button" type="button" onClick={clearFilters} disabled={!hasActiveFilters}>
                Clear filters
              </button>
            </div>
            {itemsQuery.isError ? (
              <ErrorState retry={() => itemsQuery.refetch()} />
            ) : itemsQuery.isLoading ? (
              <div className="dish-grid">
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                title="No menu items found"
                description="Create your first dish or adjust the filters."
                action={
                  <button
                    className="soft-button"
                    onClick={() => setDishDialog({ open: true })}
                  >
                    <Plus size={16} /> Add Dish
                  </button>
                }
              />
            ) : (
              <div className="dish-grid">
                {items.map((item) => (
                  <DishCard
                    key={item.id}
                    item={item}
                    categories={categories}
                    onEdit={() => setDishDialog({ open: true, item })}
                    onDelete={() => setConfirmDialog({ type: "dish", id: item.id, name: item.dish_name })}
                    onToggle={async () => {
                      try {
                        await mutations.toggle.mutateAsync({
                          id: item.id,
                          available: !item.available_for_customers,
                        });
                        toast.success("Availability updated");
                      } catch {
                        toast.error("Availability could not be updated");
                      }
                    }}
                  />
                ))}
              </div>
            )}
            {!itemsQuery.isLoading && !itemsQuery.isError && <LoadMoreSentinel hasMore={hasMoreItems} loading={itemsQuery.isFetchingNextPage} onLoadMore={() => itemsQuery.fetchNextPage()} />}
          </>
        ) : (
          <CategoryTable
            categories={categories}
            loading={categoriesQuery.isLoading}
            error={categoriesQuery.isError}
            retry={() => categoriesQuery.refetch()}
            onAdd={() => setCategoryDialog({ open: true })}
            onEdit={(item) => setCategoryDialog({ open: true, category: item })}
            onDelete={(item) => setConfirmDialog({ type: "category", id: item.id, name: item.name })}
            hasMore={hasMoreCategories}
            loadingMore={categoriesQuery.isFetchingNextPage}
            onLoadMore={() => categoriesQuery.fetchNextPage()}
          />
        )}
      </main>
      <DishDialog
        open={dishDialog.open}
        item={dishDialog.item}
        categories={categories}
        onClose={() => setDishDialog({ open: false })}
        onSubmit={saveDish}
      />
      <CategoryDialog
        open={categoryDialog.open}
        category={categoryDialog.category}
        onClose={() => setCategoryDialog({ open: false })}
        onSubmit={saveCategory}
      />
      <QrDialog open={qrOpen} onClose={() => setQrOpen(false)} />
      <ConfirmDialog open={Boolean(confirmDialog)} name={confirmDialog?.name ?? ""} type={confirmDialog?.type ?? "dish"} loading={mutations.remove.isPending || mutations.removeCategory.isPending} onClose={() => setConfirmDialog(null)} onConfirm={confirmDelete} />
    </>
  );
}

function DishCard({
  item,
  categories,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: MenuItem;
  categories: Category[];
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const categoryName =
    categories.find((category) => category.id === item.category)?.name ??
    `Category #${item.category}`;
  return (
    <article className="dish-card">
      <div
        className="dish-image"
        style={
          item.image ? { backgroundImage: `url(${item.image})` } : undefined
        }
      >
        {!item.image && <ImagePlus size={30} color="#b99b87" />}
        <span
          className={`availability ${item.available_for_customers ? "" : "off"}`}
        >
          {item.available_for_customers ? "Available" : "Hidden"}
        </span>
      </div>
      <div className="dish-body">
        <div className="dish-title">
          <div>
            <h3>{item.dish_name}</h3>
            <div className="category-badge">{categoryName}</div>
          </div>
          <div className="card-actions">
            <button
              className="more-button"
              onClick={onEdit}
              aria-label="Edit dish"
            >
              <Edit3 size={16} />
            </button>
            <button
              className="more-button danger"
              onClick={onDelete}
              aria-label="Delete dish"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <p className="muted dish-ingredients">
          {item.ingredients || "No ingredients listed"}
        </p>
        <div className="price">
          {currency(item.price)}{" "}
          {Number(item.discount) > 0 && (
            <span className="discount-badge">-{currency(item.discount)}</span>
          )}
        </div>
        <div className="dish-meta">
          <span>
            <Clock3 size={12} /> {item.wait_time_minutes} min
          </span>
          <button className="text-button" onClick={onToggle}>
            {item.available_for_customers ? "Hide" : "Publish"}
          </button>
        </div>
      </div>
    </article>
  );
}

function CategoryTable({
  categories,
  loading,
  error,
  retry,
  onAdd,
  onEdit,
  onDelete,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  categories: Category[];
  loading: boolean;
  error: boolean;
  retry: () => void;
  onAdd: () => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className="table-wrap">
      <div className="table-header">
        <h3>Categories</h3>
        <button className="soft-button" onClick={onAdd}>
          <Plus size={16} /> Add Category
        </button>
      </div>
      {error ? (
        <ErrorState retry={retry} />
      ) : loading ? (
        <div className="table-loading">
          <div className="skeleton" />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create a category to organize your menu."
          action={
            <button className="soft-button" onClick={onAdd}>
              <Plus size={16} /> Add Category
            </button>
          }
        />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Display order</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.display_order ?? 0}</td>
                <td>{new Date(category.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    className="more-button"
                    onClick={() => onEdit(category)}
                    aria-label="Edit category"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="more-button danger"
                    onClick={() => onDelete(category)}
                    aria-label="Delete category"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && !error && <LoadMoreSentinel hasMore={hasMore} loading={loadingMore} onLoadMore={onLoadMore} />}
    </div>
  );
}

function DishDialog({
  open,
  item,
  categories,
  onClose,
  onSubmit,
}: {
  open: boolean;
  item?: MenuItem;
  categories: Category[];
  onClose: () => void;
  onSubmit: (
    values: DishValues,
    image: File | null,
    existing?: MenuItem,
  ) => Promise<void>;
}) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(item?.image ?? null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DishFormInput, unknown, DishValues>({
    resolver: zodResolver(dishSchema),
    defaultValues: {
      dish_name: item?.dish_name ?? "",
      category: item?.category ?? 0,
      price: String(item?.price ?? ""),
      unit_cost: String(item?.unit_cost ?? ""),
      discount: String(item?.discount ?? "0"),
      wait_time_minutes: item?.wait_time_minutes ?? 1,
      ingredients: item?.ingredients ?? "",
      available_for_customers: item?.available_for_customers ?? true,
    },
  });
  useEffect(() => {
    if (open) {
      reset({
        dish_name: item?.dish_name ?? "",
        category: item?.category ?? 0,
        price: String(item?.price ?? ""),
        unit_cost: String(item?.unit_cost ?? ""),
        discount: String(item?.discount ?? "0"),
        wait_time_minutes: item?.wait_time_minutes ?? 1,
        ingredients: item?.ingredients ?? "",
        available_for_customers: item?.available_for_customers ?? true,
      });
      setImage(null);
      setPreview(item?.image ?? null);
    }
  }, [item, open, reset]);
  if (!open) return null;
  return (
    <Dialog title={item ? "Edit dish" : "Add dish"} onClose={onClose}>
      <form
        className="dialog-form"
        onSubmit={handleSubmit((values) => onSubmit(values, image, item))}
      >
        <div className="form-grid">
          <Field label="Dish name" error={errors.dish_name?.message}>
            <input {...register("dish_name")} placeholder="e.g. Mountain Latte" />
          </Field>
          <Field label="Category" error={errors.category?.message}>
              <select {...register("category")} disabled={!categories.length}>
              <option value="0">{categories.length ? "Choose category" : "Create a category first"}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price" error={errors.price?.message}>
            <input
              {...register("price")}
              placeholder="e.g. 180.00"
              inputMode="decimal"
              onInput={(event) => numericInput(event)}
            />
          </Field>
          <Field label="Unit cost" error={errors.unit_cost?.message}>
            <input
              {...register("unit_cost")}
              placeholder="e.g. 65.00"
              inputMode="decimal"
              onInput={(event) => numericInput(event)}
            />
          </Field>
          <Field label="Discount" error={errors.discount?.message}>
            <input
              {...register("discount")}
              placeholder="e.g. 0.00"
              inputMode="decimal"
              onInput={(event) => numericInput(event)}
            />
          </Field>
          <Field
            label="Wait time (minutes)"
            error={errors.wait_time_minutes?.message}
          >
            <input
              {...register("wait_time_minutes")}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              onInput={(event) => numericInput(event, 0)}
              placeholder="e.g. 10"
            />
          </Field>
        </div>
        <Field label="Ingredients">
          <textarea
            {...register("ingredients")}
            rows={3}
            placeholder="e.g. Espresso, steamed milk, cinnamon"
          />
        </Field>
        <label className="upload-box">
          {preview ? (
            <img src={preview} alt="Dish preview" />
          ) : (
            <>
              <ImagePlus size={24} />
              <span>Choose a dish image</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setImage(file);
              if (file) setPreview(URL.createObjectURL(file));
            }}
          />
        </label>
        <label className="check dish-availability-check">
          <input {...register("available_for_customers")} type="checkbox" />{" "}
          Available for customers
        </label>
        <div className="dialog-actions">
          <button type="button" className="outline-button" onClick={onClose}>
            Cancel
          </button>
          <button className="soft-button" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : item ? "Save changes" : "Create dish"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function CategoryDialog({
  open,
  category,
  onClose,
  onSubmit,
}: {
  open: boolean;
  category?: Category;
  onClose: () => void;
  onSubmit: (values: CategoryValues, existing?: Category) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormInput, unknown, CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      display_order: category?.display_order ?? 0,
    },
  });
  useEffect(() => {
    if (open)
      reset({
        name: category?.name ?? "",
        display_order: category?.display_order ?? 0,
      });
  }, [category, open, reset]);
  if (!open) return null;
  return (
    <Dialog
      title={category ? "Edit category" : "Add category"}
      onClose={onClose}
    >
      <form
        className="dialog-form"
        onSubmit={handleSubmit((values) => onSubmit(values, category))}
      >
        <Field label="Name" error={errors.name?.message}>
          <input {...register("name")} placeholder="e.g. Coffee" />
        </Field>
        <Field label="Display order" error={errors.display_order?.message}>
          <input
            {...register("display_order")}
            type="number"
            min="0"
            placeholder="e.g. 1"
          />
        </Field>
        <div className="dialog-actions">
          <button type="button" className="outline-button" onClick={onClose}>
            Cancel
          </button>
          <button className="soft-button" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : category
                ? "Save changes"
                : "Create category"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function LoadMoreSentinel({ hasMore, loading, onLoadMore }: { hasMore: boolean; loading: boolean; onLoadMore: () => void }) {
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasMore || loading || !sentinel.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onLoadMore();
    }, { rootMargin: "240px" });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);
  if (!hasMore && !loading) return null;
  return <div ref={sentinel} className="load-more-sentinel" aria-live="polite">{loading ? "Loading more..." : "Scroll to load more"}</div>;
}

function QrDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    api
      .get("/public/qr-code/", { responseType: "blob" })
      .then((response) => {
        if (active) setUrl(URL.createObjectURL(response.data));
      })
      .catch(() => toast.error("QR code could not be loaded"))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);
  if (!open) return null;
  const menuUrl =
    process.env.NEXT_PUBLIC_PUBLIC_MENU_URL ??
    `${window.location.origin}/public/menu`;
  return (
    <Dialog title="Menu QR code" onClose={onClose}>
      <div className="qr-content">
        <p className="muted">
          Customers scan this QR code to view today&apos;s menu.
        </p>
        {loading ? (
          <div className="qr-skeleton" />
        ) : url ? (
          <img
            className="qr-image"
            src={url}
            alt="Mountain Cafe menu QR code"
          />
        ) : (
          <p className="field-error">QR code unavailable.</p>
        )}
        <div className="qr-actions">
          {url && (
            <a
              className="outline-button"
              href={url}
              download="mountain-cafe-menu-qr.png"
            >
              <Download size={16} /> Download
            </a>
          )}
          <button className="outline-button" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
          <button
            className="soft-button"
            onClick={() =>
              navigator.clipboard
                .writeText(menuUrl)
                .then(() => toast.success("Menu URL copied"))
            }
          >
            Copy menu URL
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="dialog-header">
          <h2>{title}</h2>
          <button
            className="more-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function ConfirmDialog({ open, name, type, loading, onClose, onConfirm }: { open: boolean; name: string; type: "dish" | "category"; loading: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return <Dialog title={`Delete ${type}`} onClose={onClose}><div className="confirm-content"><p>Delete <strong>{name}</strong>? This action cannot be undone.</p><div className="dialog-actions"><button type="button" className="outline-button" onClick={onClose}>Cancel</button><button type="button" className="danger-button" disabled={loading} onClick={onConfirm}>{loading ? "Deleting..." : "Delete"}</button></div></div></Dialog>;
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      {label}
      {children}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <Utensils size={24} />
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      {action}
    </div>
  );
}
function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="empty-state">
      <h3>Could not load this data</h3>
      <p className="muted">Check the backend connection and try again.</p>
      <button className="soft-button" onClick={retry}>
        Retry
      </button>
    </div>
  );
}
