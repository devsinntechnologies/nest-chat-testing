import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/about-us",
  "/auth",
  "/blog",
  "/contact",
  "/messages",
  "/auth",
  "/terms-and-condition",
]; // Add more public pages as needed

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const roleCookie = req.cookies.get("userRole")?.value;
  const userRole = roleCookie || "buyer";

  // If no cookie, set default role to "buyer"
  if (!roleCookie) {
    const response = NextResponse.next();
    response.cookies.set("userRole", "buyer", { path: "/" });
    return response;
  }

  // Allow public routes for all users
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow access to the public folder (images, icons, fonts, etc.)
  if (pathname.startsWith("/images/") || pathname.startsWith("/icons/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next/static/") || pathname.startsWith("/_next/image/") || pathname.startsWith("/favicon.ico") || pathname.startsWith("/images/") || pathname.startsWith("/icons/") || pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2|woff|ttf|eot)$/)) {
    return NextResponse.next();
  }

  // Restrict buyers from accessing /seller routes
  if (pathname.startsWith("/seller") && userRole !== "seller") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Restrict sellers from accessing non-public routes (except /seller routes)
  if (!pathname.startsWith("/seller") && userRole === "seller") {
    return NextResponse.redirect(new URL("/seller", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images/|icons/).*)",
  ], // Excludes static assets and public folder
};
