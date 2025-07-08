"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useResetPasswordMutation,
} from "@/hooks/UseAuth";
import { toast } from "sonner";
import requireAuth from "@/components/hoc/requireAuth";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeOffIcon, Loader} from "lucide-react";
import { Button } from "@/components/ui/button";

const Page = () => {
  const router = useRouter();
  const [otp, setOtp] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [ resetPassword,{ isLoading: resetLoading } ] = useResetPasswordMutation();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = sessionStorage.getItem("forgotUser");
      const parsedData = storedData ? JSON.parse(storedData) : null;
      if (storedData) {
        if (!parsedData.email) {
          // router.push("/auth/forgot-password");
        }else if(parsedData.verify === false){
          // router.push('/verify-otp')
        } else {
          setOtp(parsedData.otp || "");
        }
      }
    }
  }, [router]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      toast("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast("Passwords do not match.");
      return;
    }

    try {
      const response = await resetPassword({ otp, password }).unwrap();
      if (response.success) {
        toast.success(response.message);
        sessionStorage.removeItem("forgotUser");
        router.push("/auth/login");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to reset password.", {
        description: error?.message
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
      <div className="text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-center">Reset Password</h2>
      </div>
      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label className="text-sm">Reset Password</label>
            <div className="relative w-full flex items-center mt-2 px-3 py-2 md:py-3.5 border border-border rounded-md focus:outline-none focus:border-primary">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full focus:outline-none"
              />
              {/* Show/Hide Password Button */}
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-6 absolute inset-y-0 right-3 flex items-center justify-center text-secondary"
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm">Confirm Password</label>
            <div className="relative w-full flex items-center mt-2 px-3 py-2 md:py-3.5 border border-border rounded-md focus:outline-none focus:border-primary">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full focus:outline-none"
              />
              {/* Show/Hide Confirm Password Button */}
              {confirmPassword && (
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="w-6 absolute inset-y-0 right-3 flex items-center justify-center text-secondary"
                >
                  {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Submit Reset Password */}
        <Button type="submit" className={`w-full`} disabled={resetLoading}>
          {resetLoading ? (
            <Loader className="animate-spin" size={16} />
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>
    </div>
  );
};
export default requireAuth(Page);
