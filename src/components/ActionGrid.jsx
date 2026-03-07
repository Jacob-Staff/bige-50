import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  MapPin, 
  HelpCircle, 
  MessageSquare, 
  Store, 
  Gift,
  ArrowRightLeft,
  Smartphone
} from "lucide-react";

const actions = [
  { id: "buy", label: "Buy Goods", icon: ShoppingBag, path: "/goods", color: "bg-blue-100", text: "text-blue-600" },
  { id: "transfer", label: "Transfer", icon: ArrowRightLeft, path: "/transfer", color: "bg-purple-100", text: "text-purple-600" },
  { id: "airtime", label: "Airtime", icon: Smartphone, path: "/airtime", color: "bg-green-100", text: "text-green-600" },
  { id: "shop", label: "Merchant", icon: Store, path: "/pay", color: "bg-orange-100", text: "text-orange-600" },
  { id: "rewards", label: "Rewards", icon: Gift, path: "/rewards", color: "bg-red-100", text: "text-red-600" },
  { id: "support", label: "Support", icon: HelpCircle, path: "/faq", color: "bg-gray-100", text: "text-gray-600" },
];

export default function ActionGrid() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4 p-1">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <div
            key={action.id}
            onClick={() => navigate(action.path)}
            className="group bg-white rounded-2xl border border-gray-50 shadow-sm p-4 text-center cursor-pointer 
                       transition-all duration-200 hover:shadow-md hover:-translate-y-1 active:scale-95"
          >
            <div className={`h-12 w-12 mx-auto mb-3 rounded-2xl ${action.color} flex items-center justify-center 
                            transition-transform group-hover:rotate-3`}>
              <Icon className={`${action.text}`} size={24} />
            </div>
            <p className="text-[12px] font-semibold text-gray-700 leading-tight">
              {action.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}