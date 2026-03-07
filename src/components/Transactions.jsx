const actions = [
  "Buy",
  "Track Order",
  "FAQs",
  "Contact",
  "Shop",
  "Rewards",
];

export default function ActionGrid() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {actions.map((action) => (
        <div
          key={action}
          className="bg-white rounded-xl shadow p-4 text-center cursor-pointer hover:bg-blue-50"
        >
          <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-blue-100"></div>
          <p className="text-sm font-medium">{action}</p>
        </div>
      ))}
    </div>
  );
}
