"use client";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import Cookies from "js-cookie";

const isSeller = (WrappedComponent) => {
  const UserMode = (props) => {
    const token = useSelector((state: RootState) => state.authSlice.token);
    const userMode = useSelector((state: RootState) => state.modeSlice.mode);
    const router = useRouter();

    useEffect(() => {
      if (!token) {
        if (Cookies.get("userRole")) {
          Cookies.set("userRole", "buyer", { path: "/" });
        }
        
        // ✅ Redirect to login page
        toast.error("Not logged in", {
          description: "Please login first",
        });
        router.push("/auth/login");
      }
    }, [token, router]);

    useEffect(() => {
      if (token && userMode === "buyer") {
        router.push("/");
      }
    }, [userMode, token, router]);

    if (userMode === "seller") {
      return <WrappedComponent {...props} />;
    }

    return (
      <div className="flex flex-col items-center justify-center space-y-4 w-full h-[80vh]">
        Loading...
      </div>
    );
  };

  return UserMode;
};

export default isSeller;
