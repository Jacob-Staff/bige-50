import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { Loader2 } from "lucide-react";

// AUTHENTICATION
import Login from "./pages/Login";
import Register from "./pages/Register";

// CORE PAGES
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Manage from "./pages/Manage";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import SecurityReport from "./pages/SecurityReport";
import Membership from "./pages/Membership";

// INSTITUTIONAL OBJECTIVES (Bige-50 Protocol)
import Swap from "./pages/Swap";           
import EconoPlus from "./pages/EconoPlus"; 
import Forum from "./pages/Forum";
import NewPost from "./pages/NewPost";           
import Afribas from "./pages/Afribas"; 
import Bige50User from "./pages/Bige50User"; 
import AdminDashboard from "./pages/AdminDashboard"; 
import AdminManagement from "./pages/AdminManagement"; 
import Certificate from "./pages/Certificate";
import NodesMap from "./pages/NodesMap";      
import Vault from "./pages/Vault";           
import PayLinks from "./pages/PayLinks";    
import ThreadDetail from "./pages/ThreadDetail";
import LoanApplication from "./pages/LoanApplication";

// TRANSACTIONAL TOOLS
import Transfer from "./pages/Transfer";    
import Withdraw from "./pages/Withdraw";    
import AddMoney from "./pages/AddMoney"; // ADDED: Deposit Page Import
import Statement from "./pages/Statement";
import Notifications from "./pages/Notifications";
import TransactionsList from "./pages/TransactionsList";
import TransactionDetails from "./pages/TransactionDetails";

/* =========================================
   SECURITY GATEKEEPER (PROTECTED ROUTE)
   ========================================= */
function ProtectedRoute({ children, session }) {
  if (session === undefined) return (
    <div style={{
      display: 'flex', 
      height: '100vh', 
      width: '100vw',
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#000000', 
    }}>
      <div style={{
        width: '490px', 
        maxWidth: '100%',
        height: '100vh',
        background: '#010409', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 0 100px rgba(0,0,0,1)'
      }}>
        <Loader2 className="animate-spin" size={32} color="#f59e0b" />
        <p style={{ marginTop: '20px', letterSpacing: '3px', fontSize: '9px', fontWeight: '900', color: '#f59e0b', textAlign: 'center', textTransform: 'uppercase', opacity: 0.8 }}>
          Initialising Bige-50 Protocol...
        </p>
      </div>
    </div>
  );
  
  return session ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const [userRole, setUserRole] = useState(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setIsRoleLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setIsRoleLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    setIsRoleLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setUserRole(data.role);
      } else {
        setUserRole('user'); 
      }
    } catch (err) {
      setUserRole('user');
    } finally {
      setIsRoleLoading(false);
    }
  };

  const getHomePath = () => {
    if (userRole === 'admin') return "/admin/dashboard";
    return "/dashboard";
  };

  if (session && isRoleLoading) {
    return <ProtectedRoute session={undefined} />;
  }

  return (
    <Routes>
      <Route path="/" element={
        session === undefined ? <ProtectedRoute session={session} /> : 
        session ? <Navigate to={getHomePath()} replace /> : <Navigate to="/login" replace />
      } />

      <Route path="/login" element={session ? <Navigate to={getHomePath()} replace /> : <Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={
        <ProtectedRoute session={session}>
          {userRole === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Dashboard />}
        </ProtectedRoute>
      } />

      <Route path="/admin/dashboard" element={
        <ProtectedRoute session={session}>
          {userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/dashboard" replace />}
        </ProtectedRoute>
      } />

      <Route path="/bige-50" element={
        <ProtectedRoute session={session}>
          {userRole === 'admin' ? <AdminDashboard /> : <Bige50User />}
        </ProtectedRoute>
      } />

      <Route path="/admin/management/:id" element={
        <ProtectedRoute session={session}>
          {userRole === 'admin' ? <AdminManagement /> : <Navigate to="/dashboard" replace />}
        </ProtectedRoute>
      } />

      <Route path="/afribas" element={<ProtectedRoute session={session}><Afribas /></ProtectedRoute>} />
      <Route path="/security-report" element={<ProtectedRoute session={session}><SecurityReport /></ProtectedRoute>} />
      <Route path="/certificate" element={<ProtectedRoute session={session}><Certificate /></ProtectedRoute>} />
      <Route path="/nodes" element={<ProtectedRoute session={session}><NodesMap /></ProtectedRoute>} />
      
      <Route path="/swap" element={<ProtectedRoute session={session}><Swap /></ProtectedRoute>} />
      <Route path="/vault" element={<ProtectedRoute session={session}><Vault /></ProtectedRoute>} />
      <Route path="/invest" element={<ProtectedRoute session={session}><EconoPlus /></ProtectedRoute>} />
      <Route path="/loan-application" element={<LoanApplication />} />
      
      <Route path="/transfer" element={<ProtectedRoute session={session}><Transfer /></ProtectedRoute>} />
      <Route path="/withdraw" element={<ProtectedRoute session={session}><Withdraw /></ProtectedRoute>} />
      <Route path="/deposit" element={<ProtectedRoute session={session}><AddMoney /></ProtectedRoute>} /> {/* ADDED: Deposit Route */}
      <Route path="/links" element={<ProtectedRoute session={session}><PayLinks /></ProtectedRoute>} />
      
      <Route path="/forum" element={<ProtectedRoute session={session}><Forum /></ProtectedRoute>} />
      <Route path="/forum/new" element={<ProtectedRoute session={session}><NewPost /></ProtectedRoute>} />
      <Route path="/forum/:id" element={<ProtectedRoute session={session}><ThreadDetail /></ProtectedRoute>} />
      
      <Route path="/transactions" element={<ProtectedRoute session={session}><TransactionsList /></ProtectedRoute>} />
      <Route path="/transaction/:id" element={<ProtectedRoute session={session}><TransactionDetails /></ProtectedRoute>} />
      <Route path="/statement" element={<ProtectedRoute session={session}><Statement /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute session={session}><Notifications /></ProtectedRoute>} />

      <Route path="/profile" element={<ProtectedRoute session={session}><Profile /></ProtectedRoute>} />
      <Route path="/manage" element={<ProtectedRoute session={session}><Manage /></ProtectedRoute>} />
      <Route path="/privacy" element={<ProtectedRoute session={session}><Privacy /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute session={session}><Support /></ProtectedRoute>} />
      
      <Route path="/membership" element={<ProtectedRoute session={session}><Membership /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={getHomePath()} replace />} />
    </Routes>
  );
}