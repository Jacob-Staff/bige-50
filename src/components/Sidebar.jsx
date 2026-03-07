import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Wallet, History, User, 
  LogOut, Settings, ShieldCheck, X 
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const linkClass = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      isActive 
        ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
        : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
    }`;

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* SIDEBAR PANEL */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r px-4 py-8 
        flex flex-col justify-between transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div>
          <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={28} />
              <span className="font-bold text-xl tracking-tight text-gray-900">BIGE-50</span>
            </div>
            {/* Close button only visible on mobile */}
            <button onClick={onClose} className="lg:hidden text-gray-400 p-1">
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-2">
            <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </NavLink>
            <NavLink to="/wallet" className={linkClass} onClick={onClose}>
              <Wallet size={20} />
              <span className="font-medium">Wallet</span>
            </NavLink>
            <NavLink to="/mini-statement" className={linkClass} onClick={onClose}>
              <History size={20} />
              <span className="font-medium">Transactions</span>
            </NavLink>
            <NavLink to="/profile" className={linkClass} onClick={onClose}>
              <User size={20} />
              <span className="font-medium">Profile</span>
            </NavLink>
          </nav>
        </div>

        <div className="border-t pt-6">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}