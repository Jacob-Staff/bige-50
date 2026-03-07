import Topbar from "../components/Topbar";
import Drawer from "../components/Drawer";
import { useState } from "react";

export default function MerchantDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="app-wrapper">
      <Topbar onMenuClick={() => setDrawerOpen(true)} />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="app-content">
        {/* SUMMARY */}
        <section className="summary-grid">
          <SummaryCard title="Total Balance" value="$12,450.00" />
          <SummaryCard title="Today’s Collections" value="$2,100.00" />
          <SummaryCard title="Pending Settlements" value="$850.00" />
          <SummaryCard title="Available" value="$11,600.00" />
        </section>

        {/* WALLET */}
        <section className="card">
          <h3>Wallet Overview</h3>
          <p>Primary Wallet • USD</p>
          <strong className="wallet-amount">$12,450.00</strong>
        </section>

        {/* QUICK ACTIONS */}
        <section className="quick-actions">
          <ActionButton label="Create Payment Link" />
          <ActionButton label="QR Payment" />
          <ActionButton label="Withdraw" />
          <ActionButton label="Bulk Pay" />
        </section>

        {/* TRANSACTIONS */}
        <section className="card">
          <h3>Recent Transactions</h3>

          <TransactionRow
            ref="INV-10231"
            amount="$120.00"
            status="Success"
          />
          <TransactionRow
            ref="INV-10230"
            amount="$350.00"
            status="Pending"
          />
        </section>

        {/* PAYMENT LINKS */}
        <section className="card">
          <h3>Payment Links</h3>
          <p>Active Links: <strong>4</strong></p>
          <p>Total Collected: <strong>$5,800</strong></p>
        </section>
      </main>
    </div>
  );
}

/* --- Components --- */

function SummaryCard({ title, value }) {
  return (
    <div className="summary-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ActionButton({ label }) {
  return <div className="quick-action">{label}</div>;
}

function TransactionRow({ ref, amount, status }) {
  return (
    <div className="transaction-row">
      <span>{ref}</span>
      <span>{amount}</span>
      <span className={`status ${status.toLowerCase()}`}>
        {status}
      </span>
    </div>
  );
}
