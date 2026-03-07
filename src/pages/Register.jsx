import { v4 as uuidv4 } from "uuid";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Loader2,
  ShieldCheck,
  UserPlus,
  Globe,
  Building2,
  User,
  Phone,
  Landmark,
  Lock,
} from "lucide-react";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    accountType: "individual",
    fullName: "",
    companyName: "",
    institutionName: "",
    email: "",
    phone: "",
    country: "Zambia",
    bankName: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword)
      return alert("Passwords do not match");

    if (form.password.length < 6)
      return alert("Password must be at least 6 characters");

    setLoading(true);

    try {
      const displayName =
        form.fullName || form.companyName || form.institutionName;

      // 1️⃣ Create Auth User
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: displayName,
              phone: form.phone,
              country: form.country,
              account_type: form.accountType,
              bank_name: form.bankName,
            },
          },
        });

      if (authError) throw authError;

      if (!authData?.user) throw new Error("User not created");

      const userId = authData.user.id;

      // 2️⃣ Generate unique reference
      const reference = "REG-" + uuidv4();

      // 3️⃣ Insert registration deposit transaction
      const { error: txnError } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: userId,
            amount: 50, // registration fee
            status: "processing",
            bank_name: form.bankName,
            country: form.country,
            type: "deposit", // ✅ FIXED
            reference_number: reference, // ✅ REQUIRED
          },
        ]);

      if (txnError) {
        console.error("Transaction insert error:", txnError);
        throw txnError;
      }

      console.log("Registration transaction created:", reference);

      // 4️⃣ Call Lenco Payment Function
      try {
        const firstName =
          form.fullName?.split(" ")[0] || displayName || "User";
        const lastName =
          form.fullName?.split(" ").slice(1).join(" ") || "";

        const lencoRes = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/lenco-pay`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: form.email,
              userId,
              firstName,
              lastName,
              reference, // send same reference to Lenco
              amount: 50,
            }),
          }
        );

        const lencoData = await lencoRes.json();
        console.log("Lenco response:", lencoData);
      } catch (lencoErr) {
        console.warn("Lenco request error:", lencoErr);
      }

      alert("Registration successful! Please complete payment.");
      navigate("/dashboard");
    } catch (err) {
      alert(err.message || "An error occurred.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <div className="brand-header">
          <ShieldCheck size={38} color="#2563eb" />
          <h2 className="register-brand">BIGE-50</h2>
        </div>

        <div className="register-intro">
          <h3 className="register-title">Create Account</h3>
          <p className="register-subtitle">
            Secure digital banking for Zambia
          </p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label>
              <User size={14} /> Account Type
            </label>
            <select
              name="accountType"
              value={form.accountType}
              onChange={handleChange}
              className="register-input"
            >
              <option value="individual">Individual / Personal</option>
              <option value="company">Private Company</option>
              <option value="government">
                Government Institution
              </option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <Building2 size={14} />
              {form.accountType === "individual"
                ? "Full Legal Name"
                : form.accountType === "company"
                ? "Registered Company Name"
                : "Institution Name"}
            </label>
            <input
              name={
                form.accountType === "individual"
                  ? "fullName"
                  : form.accountType === "company"
                  ? "companyName"
                  : "institutionName"
              }
              value={
                form[
                  form.accountType === "individual"
                    ? "fullName"
                    : form.accountType === "company"
                    ? "companyName"
                    : "institutionName"
                ]
              }
              placeholder="As it appears on ID/Documents"
              onChange={handleChange}
              className="register-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="email@example.com"
              onChange={handleChange}
              className="register-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <Phone size={14} /> Phone
              </label>
              <input
                name="phone"
                placeholder="097..."
                onChange={handleChange}
                className="register-input"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Globe size={14} /> Country
              </label>
              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                className="register-input"
                required
              >
                <option value="Zambia">Zambia</option>
                <option value="South Africa">
                  South Africa
                </option>
                <option value="Kenya">Kenya</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>
              <Landmark size={14} /> Settlement Bank
            </label>
            <input
              name="bankName"
              placeholder="e.g. Zanaco, ABSA, FNB"
              onChange={handleChange}
              className="register-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <Lock size={14} /> Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••"
                onChange={handleChange}
                className="register-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••"
                onChange={handleChange}
                className="register-input"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="register-btn"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <UserPlus size={18} />
            )}
            {loading
              ? "Establishing Secure Connection..."
              : "Register Securely"}
          </button>
        </form>

        <div className="register-footer">
          Already a member?{" "}
          <span
            className="login-link-btn"
            onClick={() => navigate("/login")}
          >
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
}