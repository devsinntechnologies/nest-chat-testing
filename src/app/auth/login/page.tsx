// @ts-nocheck
"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLoginMutation } from "@/hooks/UseAuth";
import { useDispatch } from "react-redux";
import { setLogin } from "@/slice/authSlice";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import requireAuth from "@/components/hoc/requireAuth";
import { BASE_URL } from "@/lib/constants";

const Page = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      toast.dismiss();
      const toastId = toast.loading("Logging in...");
      const response = await login({ email, password }).unwrap();

      if (response?.success) {
        toast.dismiss(toastId);
        toast.success("Login Successful");
        const lastVisitedPath = localStorage.getItem("lastVisitedPath") || "/";
        dispatch(setLogin({ token: response?.data.token }));
        router.push(lastVisitedPath);
      } else if (!response?.success && response?.isVerify === false) {
        sessionStorage.setItem("userVerify", JSON.stringify({ email, verify: false }));
        router.push("/auth/verify-email");
      } else {
        toast.dismiss(toastId);
        toast.error(response?.message || "Login Failed");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error?.data?.message || "Failed to login");
    }
  };


  return (
    <div className="flex pt-8 pb-16 items-center justify-center">
      <div className="flex flex-col gap-5 w-full mx-2 md:mx-0">
        <div className="space-y-6 px-4 py-9 md:p-9 border-2 border-border rounded-xl w-full md:w-[534px]">
          <div className="hidden md:flex justify-center">
            <Link href="/">
              <Image src="/logo.svg" alt="logo" className="w-37 cursor-pointer" width={200} height={100} />
            </Link>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-start">Log in</h2>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-secondary">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 block w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:border-primary"
                  placeholder="Enter your email"
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-semibold tracking-wide text-secondary">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 block w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:border-primary"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 text-xs focus:outline-none flex items-center text-secondary mt-8 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
            </div>
            <div className="w-full flex items-center justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-secondary cursor-pointer underline">
                Forgot Password?
              </Link>
            </div>
            <button
              type="submit"
              className="w-full tracking-wide flex justify-center py-3 px-4 border border-transparent rounded-full cursor-pointer text-sm text-white bg-primary focus:outline-none"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Continue"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-secondary">Or</span>
              </div>
            </div>

            <div className="text-sm text-secondary mt-4">
              By continuing, you agree to Next JS <Link href="/terms-and-condition"><span className="text-black underline cursor-pointer">Conditions of Use</span></Link> and <span className="text-black underline cursor-pointer">Privacy Notice</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white tracking-wide text-secondary">New to Next JS</span>
          </div>
        </div>

        <Link
          href="/auth/signup"
          className="flex justify-center py-3 px-4 border border-transparent rounded-full text-sm tracking-wide font-semibold cursor-pointer text-white bg-[#6B7280] focus:outline-none"
        >
          Create your Next JS account
        </Link>
      </div>
    </div>
  );
};

export default requireAuth(Page);
