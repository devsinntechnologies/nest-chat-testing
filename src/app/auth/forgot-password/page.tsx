"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForgotPasswordMutation } from "@/hooks/UseAuth";
import { toast } from "sonner";
import requireAuth from "@/components/hoc/requireAuth";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

const Page = () => {
  const router = useRouter();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      sessionStorage.setItem(
        "forgotUser",
        JSON.stringify({ email, verify: false })
      );
      const response = await forgotPassword({ email }).unwrap();
      if (response.success) {
        toast.success(response.message);
        router.push("/auth/verify-otp");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.", {
        description: error?.message,
      });
    }
  };
  return (
    <div className="space-y-6 px-4 py-9 md:p-9 border-2 border-border rounded-xl w-full md:w-[534px]">
      <div className="hidden md:flex justify-center">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="logo"
            className="w-37 cursor-pointer"
            width={200}
            height={100}
          />
        </Link>
      </div>
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-center">Forgot Password?</h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="text-sm">Enter your email address</label>
            <input
              type="email"
              className="mt-2 block w-full px-3 py-2 md:py-3.5 border border-border rounded-md focus:outline-none focus:border-primary"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div></div>
        <Button type="submit" className="w-full py-4" disabled={isLoading}>
          {isLoading ? <Loader className="animate-spin" size={16} /> : "Submit"}
        </Button>
      </form>
    </div>
  );
};

export default requireAuth(Page);
