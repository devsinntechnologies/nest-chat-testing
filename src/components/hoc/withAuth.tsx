"use client"
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { LockIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RootState } from "@/store/store";

const withAuth = (WrappedComponent) => {
  const Auth = (props) => {
    const token = useSelector((state:RootState) => state.authSlice.token);
    const router = useRouter();

    useEffect(() => {
      if (!token) {
        toast.error("Not logged in", {
          description: "Please login first",
        })
        router.push("/auth/login")
      }
    }, [token, router]);

    const handleRedirectHome = () => {
      router.push("/");
    };

    if (token) {
      return <WrappedComponent {...props} />;
    }

    return (
      <div className="flex flex-col items-center justify-center space-y-4 w-full h-[80vh]">
        {/* Lock Icon and Message */}
        <div className="flex items-center justify-center space-x-2">
          <LockIcon className="text-primary h-8 w-8" />
          <span className="text-lg font-semibold text-gray-700">
            You are not logged in!
          </span>
        </div>

        {/* Redirect Button */}
        <button
          onClick={handleRedirectHome}
          className="px-6 py-2 bg-primary text-white rounded-full shadow-md hover:bg-primary-dark transition-all duration-200"
        >
          Go to Home
        </button>
      </div>
    );
  };

  return Auth;
};

export default withAuth;
