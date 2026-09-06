export interface Category {
  id: number;
  name: string;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  dish_name: string;
  category: number;
  price: string | number;
  unit_cost: string | number;
  discount: string | number;
  wait_time_minutes: number;
  ingredients: string;
  image: string | null;
  available_for_customers: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicMenuItem {
  id: number;
  dish_name: string;
  category: string;
  price: string | number;
  discount: string | number;
  wait_time_minutes: number;
  ingredients: string;
  image: string | null;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user?: { id: number; email: string; first_name?: string; last_name?: string };
}

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
}
