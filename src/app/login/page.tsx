"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LockKeyhole, Mail, Mountain } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import "./login.css";

const schema = z.object({ email: z.string().email("Enter a valid email"), password: z.string().min(6, "Use at least 6 characters") });
type Values = z.infer<typeof schema>;
export default function LoginPage() { const { login } = useAuth(); const [show, setShow] = useState(false); const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });
  async function submit(values: Values) { try { await login(values); toast.success("Welcome back"); } catch { toast.error("Unable to sign in. Check your credentials."); } }
  return <main className="login-page"><div className="login-visual"><div className="brand-mark"><Mountain size={22} /> Mountain Cafe</div><div><p className="eyebrow">Operations, with intention</p><h1>A calmer way to run your cafe.</h1><p className="muted">Keep the floor, kitchen, and numbers moving in one beautiful place.</p></div><span className="visual-note">Est. 2014 · Highlands Coffee</span></div><section className="login-panel"><div className="mobile-brand"><Mountain size={20} /> Mountain Cafe</div><div className="login-copy"><p className="eyebrow">Admin portal</p><h2>Welcome back</h2><p className="muted">Sign in to your workspace.</p></div><form onSubmit={handleSubmit(submit)} className="stack-form"><label>Email<input {...register("email")} type="email" placeholder="you@mountaincafe.com" />{errors.email && <small className="field-error">{errors.email.message}</small>}</label><label>Password<div className="input-icon"><LockKeyhole size={17} /><input {...register("password")} type={show ? "text" : "password"} placeholder="Your password" /> <button type="button" className="icon-button" onClick={() => setShow(!show)} aria-label="Toggle password">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors.password && <small className="field-error">{errors.password.message}</small>}</label><div className="form-row"><label className="check"><input type="checkbox" defaultChecked /> Remember me</label><button className="text-button" type="button">Forgot password?</button></div><button className="primary-button" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</button></form><div className="login-footer"><Mail size={16} /> Need help? Contact your cafe administrator.</div></section></main>;
}
