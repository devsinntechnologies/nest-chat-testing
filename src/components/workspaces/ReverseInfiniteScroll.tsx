"use client";
import { useEffect, useRef } from "react";

interface ReverseInfiniteScrollProps {
  loadMore: () => void;
  hasMore: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
}

const ReverseInfiniteScroll = ({
  loadMore,
  hasMore,
  isLoading = false,
  children,
  className = "",
}: ReverseInfiniteScrollProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container || isLoading || !hasMore) return;

    if (container.scrollTop < 100) {
      loadMore();
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [isLoading, hasMore]);

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto h-full flex flex-col ${className}`}
    >
      {children}
    </div>
  );
};

export default ReverseInfiniteScroll;
