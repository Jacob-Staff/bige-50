import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; 
import { 
  User, Mail, Globe, Building2, 
  CreditCard, ShieldCheck, Loader2, LogOut,
  ChevronRight, Lock, HelpCircle, Camera
} from "lucide-react";
import Topbar2 from "../components/Topbar2";
import "./Profile.css"; 

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getProfile();
  }, [navigate]);

  const getProfile = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        navigate("/login");
        return;
      }

      // FIXED: Specified columns to avoid "not found in schema cache" error
      // Added country, bank_name, and account_type to the selection
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, phone, country, bank_name, account_type')
        .eq('id', authUser.id)
        .single();

      if (profileError) throw profileError;

      setUser({
        id: authUser.id,
        name: profileData?.full_name || authUser.email.split('@')[0],
        email: authUser.email,
        phone: profileData?.phone || "No phone linked",
        avatar_url: profileData?.avatar_url || null,
        country: profileData?.country || "Zambia", // Now dynamic
        bankName: profileData?.bank_name || "BIGE Digital Bank", // Now dynamic
        accountType: profileData?.account_type || "Standard Account",
        accountNumber: profileData?.phone || "09XXXXXXX"
      });

    } catch (err) {
      console.error("Profile sync error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar-${Math.random()}.${fileExt}`;

      // 1. Upload to Supabase Storage Bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update the Profile in Database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 4. Update local state
      setUser(prev => ({ ...prev, avatar_url: publicUrl }));
      alert("Profile picture updated!");

    } catch (error) {
      alert("Error uploading: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="profile-loader">
        <Loader2 className="animate-spin" size={40} color="#3b82f6" />
        <p>Loading your secure profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Topbar2 title="My Profile" />

      <div className="profile-container">
        {/* CENTERED HEADER WITH AVATAR UPLOAD */}
        <div className="profile-header-card">
          <div className="avatar-wrapper">
            <div className="avatar-circle">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="avatar-image-filled" />
              ) : (
                <div className="avatar-placeholder">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              
              <label className="avatar-upload-overlay" htmlFor="avatar-input">
                {uploading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
              </label>
              <input 
                type="file" 
                id="avatar-input" 
                hidden 
                accept="image/*" 
                onChange={uploadAvatar} 
                disabled={uploading} 
              />
            </div>
            <div className="badge-pro">
              <ShieldCheck size={10} fill="white" color="#16a34a" /> VERIFIED
            </div>
          </div>

          <div className="header-text-info">
            <h2 className="user-name">{user?.name}</h2>
            <p className="user-account-type">{user?.accountType}</p>
            <button className="edit-profile-tag" onClick={() => navigate("/manage")}>
              Edit Profile
            </button>
          </div>
        </div>

        {/* ACCOUNT INFORMATION */}
        <h3 className="section-label">Account Details</h3>
        <div className="info-group-card">
          <div className="info-item">
            <Mail size={18} className="info-icon" />
            <div className="info-text">
              <span>Email Address</span>
              <p>{user?.email}</p>
            </div>
          </div>
          <div className="info-item">
            <Globe size={18} className="info-icon" />
            <div className="info-text">
              <span>Country</span>
              <p>{user?.country}</p>
            </div>
          </div>
        </div>

        {/* SETTLEMENT BANK */}
        <h3 className="section-label">Settlement Bank</h3>
        <div className="info-group-card">
          <div className="info-item">
            <Building2 size={18} className="info-icon" />
            <div className="info-text">
              <span>Bank Name</span>
              <p>{user?.bankName}</p>
            </div>
          </div>
          <div className="info-item">
            <CreditCard size={18} className="info-icon" />
            <div className="info-text">
              <span>Account Number</span>
              <p>{user?.accountNumber}</p>
            </div>
          </div>
        </div>

        {/* PREFERENCES */}
        <h3 className="section-label">Preferences</h3>
        <div className="info-group-card">
          <div className="menu-clickable-item" onClick={() => navigate("/manage")}>
            <div className="item-left">
              <Lock size={18} className="info-icon" />
              <div className="info-text"><p>Security & Privacy</p></div>
            </div>
            <ChevronRight size={18} className="chevron-icon" />
          </div>
          <div className="menu-clickable-item">
            <div className="item-left">
              <HelpCircle size={18} className="info-icon" />
              <div className="info-text"><p>Help & Support</p></div>
            </div>
            <ChevronRight size={18} className="chevron-icon" />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="profile-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> Log Out from Device
          </button>
          <p className="app-version">BIGE v1.0.4</p>
        </div>
      </div>
    </div>
  );
}