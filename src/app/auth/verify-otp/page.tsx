"use client";
import { useState, useEffect } from "react";
import {
  useCheckOtpMutation,
  useForgotPasswordMutation,
} from "@/hooks/UseAuth";
import { Loader } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import requireAuth from "@/components/hoc/requireAuth";

const Page: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string>("");
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);
  const [checkOtp, { isLoading: otpLoading }] = useCheckOtpMutation();
  const [forgotPassword, { isLoading: forgotPasswordLoading }] =
    useForgotPasswordMutation();
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [isResendDisabled, setIsResendDisabled] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = sessionStorage.getItem("forgotUser");
      const parsedData = storedData ? JSON.parse(storedData) : null;
  
      if (!parsedData?.email) {
        router.push("/auth/forgot-password");
      } else if (parsedData.verify) {
        router.push("/auth/reset-password");
      } else {
        setEmail(parsedData.email || "");
      }
    }
  }, [router]);
  

  // Timer logic for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendTimer]);

  const handleOtpChange = (newValue: string) => {
    setOtp(newValue);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otp.length === 4) {
      checkOtp({ otp })
        .then((response) => {
          if (response?.data?.success) {
            setIsOtpVerified(true);
            sessionStorage.setItem(
              "forgotUser",
              JSON.stringify({ email, verify: true, otp })
            );
            toast.success("You can now reset your password.");
            router.push("/auth/reset-password");
          } else {
            setIsOtpVerified(false);
            toast.error("Invalid OTP", {
              description: "Please try again.",
            });
          }
        })
        .catch(() => {
          toast.error("Error during OTP verification. Please try again.");
        });
    } else {
      toast.error("OTP must be 4 digits.");
    }
  };

  const handleResendOtp = async () => {
    if (isResendDisabled) return;

    setIsResendDisabled(true);
    try {
      const response = await forgotPassword({ email });
      if (response?.data?.success) {
        setResendTimer(60);
        toast.success("OTP Sent");
      } else {
        toast.error("Failed to resend OTP. Please try again later.");
      }
    } catch {
      toast.error("Error sending OTP. Please try again.");
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
        <h2 className="text-2xl md:text-3xl font-semibold text-center">OTP Verification</h2>
        <p className="text-secondary">
          To reset your password, we&apos;ve sent a One Time Password on this{" "}
          <span className="font-semibold">Email: {email}</span>
        </p>
      </div>
      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <InputOTP
              pattern={REGEXP_ONLY_DIGITS}
              maxLength={4}
              value={otp}
              onChange={handleOtpChange}
              disabled={isOtpVerified || otpLoading}
            >
              <InputOTPGroup className="gap-4 sm:gap-6 md:gap-10">
                {Array.from({ length: 4 }, (_, index) => (
                  <InputOTPSlot
                    className="border border-border size-12 md:size-15 bg-[#F3F4F6] text-black !rounded-xl"
                    key={index}
                    index={index}
                    aria-label={`OTP slot ${index + 1}`}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>
        <div className="w-full space-y-3">
          <Button
            type="submit"
            className="w-full py-4"
            disabled={otpLoading || forgotPasswordLoading}
          >
            {otpLoading ? (
              <Loader className="animate-spin" size={16} />
            ) : (
              "Submit"
            )}
          </Button>
          <Button
            variant="link"
            type="button"
            className="w-full"
            disabled={isResendDisabled}
            onClick={handleResendOtp}
          >
            {isResendDisabled ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default requireAuth(Page);
