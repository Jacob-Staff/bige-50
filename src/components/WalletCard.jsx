import { ShieldCheck, TrendingUp } from "lucide-react";

export default function WalletCard({ balance, currency = "ZMW", loading = false }) {
  // Format numbers to have commas and 2 decimal places (e.g., 1,250.00)
  const formattedBalance = new Intl.NumberFormat('en-ZM', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance || 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 relative overflow-hidden">
      {/* Subtle Background Decoration */}
      <div className="absolute -right-4 -top-4 text-blue-50 opacity-10">
        <ShieldCheck size={120} />
      </div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Total Available Balance
          </h2>
          <div className="flex items-center gap-1 text-green-600 text-[10px] font-medium mt-1">
            <TrendingUp size={12} />
            <span>Real-time Ledger</span>
          </div>
        </div>
        <div className="bg-blue-50 p-2 rounded-lg">
          <ShieldCheck size={18} className="text-blue-600" />
        </div>
      </div>

      <div className="relative z-10">
        {loading ? (
          <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-md mb-2"></div>
        ) : (
          <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
            <span className="text-xl font-medium text-gray-400 mr-2">{currency}</span>
            {formattedBalance}
          </p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
        <p className="text-gray-400 text-[11px]">Last updated: Just now</p>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] text-gray-500 uppercase">System Live</span>
        </div>
      </div>
    </div>
  );
}