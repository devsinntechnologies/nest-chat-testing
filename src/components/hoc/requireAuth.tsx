"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
// import { toast } from 'sonner';
// import LoadingSpinner from "../loadingSpinner/LoadingSpinner";

const requireAuth = (WrappedComponent:any) => {
  const AuthComponent = (props:any) => {
    const router = useRouter();
    const token = useSelector((state: RootState) => state.authSlice.token);

    useEffect(() => {
      if (token) {
        const lastVisitedPath = localStorage.getItem("lastVisitedPath") || "/";
        localStorage.removeItem("lastVisitedPath");
        router.replace(lastVisitedPath); // Prevents navigating back
      }
    }, [token, router]);

    if (token) {
      return <div>Loading...</div>; // Replace with <LoadingSpinner />
    }

    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default requireAuth;
