"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/UseMediaQuery";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  totalPages,
  currentPage,
  onPageChange,
}) => {
  const isLargeScreen = useMediaQuery("(min-width: 768px)");

  const generatePagination = (): (number | string)[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [1];

    if (currentPage > 3) pages.push("…");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push("…");

    pages.push(totalPages);

    return isLargeScreen ? pages : [currentPage];
  };

  const paginationArray = generatePagination();

  return (
    <nav aria-label="Pagination" className="flex justify-center mt-4">
      <ul className="inline-flex gap-1 sm:gap-2 md:gap-4 h-10 items-center">
        {/* Previous */}
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="size-8 sm:size-9 flex items-center justify-center rounded-full border border-primary transition
              cursor-pointer disabled:opacity-50 disabled:pointer-events-none
              hover:bg-primary hover:text-white text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </li>

        {/* Page Numbers */}
        {paginationArray.map((page, index) => (
          <li key={index}>
            {typeof page === "number" ? (
              <button
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={`text-xs sm:text-sm size-8 sm:size-9 flex items-center justify-center rounded-full border transition
                  ${
                    page === currentPage
                      ? "bg-primary text-white border-primary"
                      : "text-primary border hover:bg-primary hover:text-white"
                  }`}
              >
                {page}
              </button>
            ) : (
              <span className="text-primary px-1 sm:px-2">…</span>
            )}
          </li>
        ))}

        {/* Next */}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className="size-8 sm:size-9 flex items-center justify-center rounded-full border border-primary transition
              cursor-pointer disabled:opacity-50 disabled:pointer-events-none
              hover:bg-primary hover:text-white text-primary"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
