// @ts-nocheck
"use client";
const FilterButtons = ({ filter, setFilter }) => {
  return (
    <div className="w-full flex items-center justify-start gap-3 py-4 text-sm">
      {["All", "Seller", "Buyer"].map((type) => (
        <button
          key={type}
          onClick={() => setFilter(type)}
          className={`transition-all duration-200 ${
            filter === type
             ? "bg-primary rounded-full py-2 w-16 font-medium text-white"
            : "text-gray-500 bg-[#f3f4f6] w-16 rounded-full py-2"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
};

export default FilterButtons;
