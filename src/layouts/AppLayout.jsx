import { useState } from "react";
import Topbar from "../components/Topbar";
import Drawer from "../components/Drawer";

export default function AppLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="app-shell">
      <Topbar onMenuClick={() => setDrawerOpen(true)} />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* MAIN CONTENT */}
      <main className="app-content">
        {children}
      </main>
    </div>
  );
}
