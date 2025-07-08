// import Footer from "@/components/layout/auth/Footer";
import Image from "next/image";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen">
      {/* <div className="w-full min-h-[calc(100vh-121px)] md:min-h-[calc(100vh-85px)] h-full flex items-center justify-center px-5 gap-5 flex-col"> */}
      <div className="w-full min-h-screen h-full flex items-center justify-center px-5 gap-5 flex-col">
        <div className="flex md:hidden justify-center">
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="logo"
              className="w-51 cursor-pointer"
              width={200}
              height={100}
            />
          </Link>
        </div>
        {children}
      </div>
      {/* <Footer /> */}
    </div>
  );
}
