import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { ShieldCheck, Upload, Loader2, CheckCircle } from "lucide-react";

export default function KYC() {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("unverified");

  const handleFileUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      const { data: { user } } = await supabase.auth.getUser();

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `kyc-docs/${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Update Profile Status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'pending',
          document_url: filePath 
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      setStatus("pending");
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="kyc-container p-6">
      <div className="status-card bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 flex flex-col items-center">
        <ShieldCheck size={48} className={status === 'verified' ? 'text-green-500' : 'text-slate-400'} />
        <h2 className="text-lg font-bold mt-4">Identity Verification</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Upload a National ID or Passport to unlock high-limit bridge settlements.
        </p>
        
        {status === 'pending' ? (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm font-medium">
            Verification in Progress...
          </div>
        ) : (
          <label className="bige-primary-btn cursor-pointer flex gap-2">
            {uploading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
            Upload Document
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        )}
      </div>
    </div>
  );
}