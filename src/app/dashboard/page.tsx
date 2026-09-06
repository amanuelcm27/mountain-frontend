import Link from "next/link";
import {
  ArrowUpRight,
  ChefHat,
  ClipboardList,
  Coffee,
  Package,
} from "lucide-react";
export default function DashboardPage() {
  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sunday, September 6</p>
          <h1>Good morning, team.</h1>
          <p className="muted">
            Here is what is happening at Mountain Cafe today.
          </p>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon">
            <Coffee size={18} />
          </span>
          <p className="muted">Menu items</p>
          <strong>24</strong>
          <small>+3 this month</small>
        </div>
        <div className="stat-card">
          <span className="stat-icon">
            <ClipboardList size={18} />
          </span>
          <p className="muted">Today&apos;s orders</p>
          <strong>—</strong>
          <small>POS module coming soon</small>
        </div>
        <div className="stat-card">
          <span className="stat-icon">
            <ChefHat size={18} />
          </span>
          <p className="muted">Kitchen status</p>
          <strong>Ready</strong>
          <small>All stations operational</small>
        </div>
        <div className="stat-card">
          <span className="stat-icon">
            <Package size={18} />
          </span>
          <p className="muted">Low stock</p>
          <strong>—</strong>
          <small>Inventory module coming soon</small>
        </div>
      </div>
      <section className="welcome-panel">
        <div>
          <p className="eyebrow">Your next step</p>
          <h2>Shape today&apos;s menu.</h2>
          <p className="muted">
            Keep dishes fresh, available, and ready for your customers.
          </p>
        </div>
        <Link href="/dashboard/menu" className="soft-button">
          Manage menu <ArrowUpRight size={16} />
        </Link>
      </section>
    </main>
  );
}
