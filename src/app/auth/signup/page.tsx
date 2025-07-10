// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSignupMutation } from "@/hooks/UseAuth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ChevronRight, EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import requireAuth from "@/components/hoc/requireAuth";
import PhoneInput from "@/components/PhoneInput";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

const Page = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNo: "",
  });
  const [passwordMatchError, setPasswordMatchError] = useState(false);

  const [signupData, { isLoading }] = useSignupMutation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const debouncedPasswordCheck = useDebouncedCallback(
    (password: string, confirmPassword: string) => {
      if(!password || !confirmPassword){
        setPasswordMatchError(false)
      } else{
      setPasswordMatchError(password !== confirmPassword);
      }
    },
    300
  );

  useEffect(() => {
    debouncedPasswordCheck(formData.password, formData.confirmPassword);
  }, [formData.password, formData.confirmPassword, debouncedPasswordCheck]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required.");
      return false;
    }
    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      toast.error("Enter a valid email address.");
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }
    if (!formData.phoneNo) {
      toast.error("Phone number is required.");
      return false;
    }
    return true;
  };

  const signup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      toast("Signing up... Please wait.");
      const response = await signupData(formData).unwrap();

      if (response?.success) {
        toast.success("Registration Successful!");
        sessionStorage.setItem(
          "userVerify",
          JSON.stringify({ email: formData.email, verify: false })
        );
        // router.push("/auth/verify-email");
        router.push("/");
      } else {
        toast.error(
          "Registration Failed: " +
            (response?.message || "Something went wrong.")
        );
      }
    } catch (err) {
      toast.error("Error: " + (err?.data?.message || "Failed to register."));
    }
  };

  return (
    <div className="flex pt-8 pb-16 items-center justify-center">
      <div className="flex flex-col gap-5 w-full mx-2 md:mx-0">
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
          <h2 className="text-2xl md:text-3xl font-semibold">Create Account</h2>
          <form onSubmit={signup} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-2 block w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:border-primary"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-2 block w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:border-primary"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label
                  htmlFor="phoneNo"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Mobile Number
                </label>
                <div className="w-full border border-border p-2 rounded-md">
                  <PhoneInput
                    value={formData.phoneNo}
                    onChange={(value) =>
                      setFormData({ ...formData, phoneNo: value })
                    }
                    className="w-60"
                  />
                </div>
              </div>
              <div className="relative">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <div className="w-full h-fit mt-2 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:border-primary"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 right-3"
                  >
                    {showPassword ? (
                      <EyeIcon size={20} />
                    ) : (
                      <EyeOffIcon size={20} />
                    )}
                  </button>
                </div>
                <p className="text-secondary text-sm mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>
              <div className="relative">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Re-enter Password
                </label>
                <div className="w-full h-fit mt-2 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:border-primary"
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 -translate-y-1/2 right-3"
                  >
                    {showConfirmPassword ? (
                      <EyeIcon size={20} />
                    ) : (
                      <EyeOffIcon size={20} />
                    )}
                  </button>
                </div>
              </div>
              {passwordMatchError && (
                <p className="text-destructive text-sm">
                  Passwords do not match.
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 border rounded-full text-sm text-white bg-primary flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Continue"}
            </button>
          </form>
          <p className="text-sm text-secondary mt-4">
            By continuing, you agree to Next JS{" "}
            <span className="text-black underline cursor-pointer">
              Conditions of Use
            </span>{" "}
            and{" "}
            <span className="text-black underline cursor-pointer">
              Privacy Notice
            </span>
          </p>
          <p className="text-sm font-semibold text-black mt-5 flex items-center gap-1">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-primary flex items-center gap-1"
            >
              Log in <ChevronRight className="size-4" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default requireAuth(Page);
