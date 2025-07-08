"use client";
import React from "react";
import withAuth from "@/components/hoc/withAuth";
import { MousePointerClick } from "lucide-react";

const Page = () => {
  return (
    <div className="hidden md:flex flex-col flex-1  items-center justify-center text-gray-500 h-screen">
      <MousePointerClick size={48} />
      <p className="text-lg mt-2">Select a chat to start messaging</p>
    </div>
  );
};

export default withAuth(Page);
