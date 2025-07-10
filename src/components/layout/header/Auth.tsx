"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logOut, setUserProfile } from "@/slice/authSlice";
import { useGetUserProfileQuery } from "@/hooks/UseAuth";
import { Loader2, LogOut } from "lucide-react";
import { toggleUserMode } from "@/slice/modeSlice";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { BASE_IMAGE } from "@/lib/constants";

const Auth = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.authSlice.user?.id);
  const isLoggedIn = useSelector((state: RootState) => state.authSlice.isLoggedIn);
  const userData = useSelector((state: RootState) => state.authSlice.userProfile);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [triggerFetch, setTriggerFetch] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logOut());
  };

  useEffect(() => {
    if (userId && isLoggedIn) {
      setTriggerFetch(true);
    }
  }, [userId, isLoggedIn]);

  const {
    data: userProfile,
    error,
    isLoading,
  } = useGetUserProfileQuery(userId, {
    skip: !triggerFetch,
  });

  useEffect(() => {
    if (userProfile) {
      dispatch(setUserProfile(userProfile.data));
    }
    if (error) {
    }
  }, [userProfile, error, dispatch]);

  const toggleMode = () => {
    dispatch(toggleUserMode());
    router.push("/seller");
  };

    const userImage = userData?.imageUrl
      ? userData.imageUrl.includes("https://lh3.googleusercontent.com")
        ? userData.imageUrl
        : BASE_IMAGE + userData.imageUrl
      : "/profileImg.png";

  return (
    <div>
      {!isLoggedIn ? (
        <Link href="/auth/login">
          <Button
            variant="default"
            className="px-4 md:px-8 text-sm md:text-base"
          >
            Login
          </Button>
        </Link>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild suppressHydrationWarning={true}>
            <Button
              suppressHydrationWarning={true}
            >
             User
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[280px] min-[390px]:w-[320px] md:w-[440px] rounded-3xl mx-2 mt-2">
            {/* profile pic and switch button */}
            {isLoading ? (
              <div className="w-full flex items-center gap-3 px-3 sm:px-6 pt-3 pb-2">
                <Skeleton className="size-16 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="w-full rounded-xl h-4" />
                  <Skeleton className="w-[60%] rounded-xl h-4" />
                </div>
              </div>
            ) : (
              <div className="cursor-pointer px-3 sm:px-6 pt-3 pb-2">
                <div className="w-full flex items-center justify-center gap-3 md:gap-1 flex-col">
                  <div className="w-full flex items-center gap-3 justify-start">
                    <div className="size-12 sm:size-16 relative shadow-lg rounded-full overflow-hidden">
                      {isImageLoading && (
                        <div className="absolute inset-0 flex justify-center items-center">
                          <Loader2
                            className="animate-spin text-primary"
                            size={18}
                          />
                        </div>
                      )}
                      <Image
                        width={64}
                        height={64}
                        src={userImage}
                        alt=""
                        onLoad={() => setIsImageLoading(false)}
                        className={`rounded-full size-full object-cover mx-auto ${
                          isImageLoading ? "invisible" : ""
                        }`}
                        onError={(e) => {
                          e.currentTarget.src =
                            "/profileImg.png";
                        }}
                      />
                    </div>
                    <p className="text-sm truncate-multiline-1 w-[180px] md:w-[240px] truncate">
                      {userData?.name}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DropdownMenuSeparator />
            <div className="p-1">
              <Button
                className="text-xs w-full sm:text-sm sm:tracking-wider bg-destructive text-white py-2"
                onClick={handleLogout}
              >
                <LogOut size={20} className="size-5 text-white" />
                Logout
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default Auth;
