"use client";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/UseDebounce";
import { useEffect } from "react";

interface SearchBarProps {
  searchTerm: string,
  setSearchTerm: React.Dispatch<React.SetStateAction<any>>,
}
const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm }) => {
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Trigger search when debounced value updates
  useEffect(() => {
    setSearchTerm(debouncedSearch);
  }, [debouncedSearch, setSearchTerm]);

  return (
    <div className="w-full h-10 overflow-hidden bg-[#f3f4f6] m-auto flex items-center border-darkGrey mt-2 rounded-lg pr-2 pl-4">
      <div className="w-6 sm:w-8">
        <Search size={22} className="text-darkGrey font-extralight" />
      </div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        type="text"
        placeholder="Search"
        className="w-full outline-none bg-transparent border-0 h-full px-2 text-darkGrey text-xs"
      />
    </div>
  );
};

export default SearchBar;
