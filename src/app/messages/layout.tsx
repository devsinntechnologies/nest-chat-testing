"use client";
import { Suspense, ReactNode, useEffect, useMemo } from "react";
import MessageSideBar from "@/components/message/MessageSideBar";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import withAuth from "@/components/hoc/withAuth";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useMediaQuery } from "@/hooks/UseMediaQuery";
import CallListener from "@/components/message/Calling/CallListener";

interface RootLayoutProps {
  children: ReactNode;
}

function RootLayout({ children }: RootLayoutProps) {
  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  const isXl = useMediaQuery("(min-width: 1280px)");
  const isLg = useMediaQuery("(min-width: 1024px)");
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const sidebarSize = useMemo(() => {
    if (isXl) return 25;
    if (isLg) return 30;
    return 40;
  }, [isXl, isLg]);

  const contentSize = useMemo(() => {
    if (isXl) return 75;
    if (isLg) return 70;
    return 60;
  }, [isXl, isLg]);

  return (
    <>
      {isDesktop ? (
        <ResizablePanelGroup
          direction="horizontal"
          className="flex w-full h-screen flex-col md:flex-row"
        >
          <ResizablePanel defaultSize={25} maxSize={50} minSize={sidebarSize}>
            <MessageSideBar />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={75} maxSize={contentSize} minSize={50}>
            <Suspense fallback={"loading..."}>
              <div className="flex flex-1 w-max-[90%]">
              <CallListener/>
                {children}</div>
            </Suspense>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex w-full h-screen flex-col md:flex-row">
          <MessageSideBar />
          <Suspense fallback={"loading..."}>
            <div className="flex flex-1 w-max-[90%]">{children}</div>
          </Suspense>
        </div>
      )}
    </>
  );
}
export default withAuth(RootLayout);
