"use client";

import { useEffect, useState } from "react";
import { Clock3, Mountain } from "lucide-react";
import api from "@/lib/api";
import { currency } from "@/lib/utils";
import type { PublicMenuItem } from "@/types/api";
import type { Paginated } from "@/types/api";

export default function PublicMenuPage() {
  const [items, setItems] = useState<PublicMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => { api.get<Paginated<PublicMenuItem> | PublicMenuItem[]>("/public/menu/", { params: { page_size: 100, available: true } }).then(({ data }) => { const payload: unknown = data && typeof data === "object" && !Array.isArray(data) && "data" in data ? (data as { data: unknown }).data : data; const results = Array.isArray(payload) ? payload : (payload as { results?: PublicMenuItem[] } | null)?.results ?? []; setItems(results as PublicMenuItem[]); }).catch(() => setError(true)).finally(() => setLoading(false)); }, []);
  const grouped = items.reduce<Record<string, PublicMenuItem[]>>((groups, item) => { (groups[item.category || "Menu"] ??= []).push(item); return groups; }, {});
  return <main className="public-menu"><div className="public-inner"><header className="public-header"><Mountain size={30} color="#9a5b3d" /><p className="eyebrow">Mountain Cafe</p><h1>Good food, higher ground.</h1><p className="muted">Welcome to Mountain Cafe. Browse our menu and enjoy your meal.</p></header>{loading ? <div className="public-loading"><div className="skeleton" /><div className="skeleton" /></div> : error ? <div className="empty-state"><h3>Menu unavailable</h3><p className="muted">Please try again shortly.</p></div> : Object.entries(grouped).map(([category, dishes]) => <section className="menu-section" key={category}><h2>{category}</h2>{dishes.map(dish => <article className="public-dish" key={dish.id}>{dish.image ? <img src={dish.image} alt="" /> : <div className="public-placeholder" />}<div><h3>{dish.dish_name}</h3><p>{dish.ingredients}</p><span className="public-price">{currency(Number(dish.price) - Number(dish.discount))}{Number(dish.discount) > 0 && <s>{currency(dish.price)}</s>}</span><span className="wait-time"><Clock3 size={12} /> {dish.wait_time_minutes} min</span></div></article>)}</section>)}</div></main>;
}
