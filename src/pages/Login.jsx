import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; 
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, Mail } from "lucide-react";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      navigate("/dashboard");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-wrapper"> {/* Strictly 490px Layout */}
      <div className="login-content-area">
        
        {/* Branded Header Section */}
        <div className="brand-header">
           <ShieldCheck size={40} color="#ffffff" />
           <h2 className="login-brand">Bige-50</h2>
           <p className="login-subtitle">Secure Access to Cloud Banking</p>
        </div>

        <div className="login-intro">
          <h3 className="login-title">Welcome Back</h3>
          <p className="login-tagline">Please enter your credentials to continue</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label><Mail size={14}/> Email Address</label>
            <input
              type="email"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              required
            />
          </div>

          <div className="form-group">
            <label><Lock size={14}/> Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {message && <div className="error-banner">{message}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In Securely"}
          </button>
        </form>

        <div className="login-footer">
          New to Bridge?{" "}
          <span className="register-link-btn" onClick={() => navigate("/register")}>
            Create Account
          </span>
        </div>
      </div>
    </div>
  );
}