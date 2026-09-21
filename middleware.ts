import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET;

const ROUTE_ROLE_MAP: { prefix: string; roles: Array<"SUPER_ADMIN" | "ACCOUNTANT" | "CLIENT"> }[] = [
  { prefix: "/dashboard/admin", roles: ["SUPER_ADMIN"] },
  { prefix: "/dashboard/accountant", roles: ["SUPER_ADMIN", "ACCOUNTANT"] },
  { prefix: "/dashboard/client", roles: ["CLIENT"] },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const matchedRoute = ROUTE_ROLE_MAP.find((route) =>
    pathname.startsWith(route.prefix)
  );

  if (!matchedRoute) return NextResponse.next();

  const token = await getToken({ req: request, secret: SECRET });
  if (!token) return redirectToLogin(request);

  const userRole = token.role as "SUPER_ADMIN" | "ACCOUNTANT" | "CLIENT";
  const userFirmId = token.firmId as string;

  if (!matchedRoute.roles.includes(userRole)) {
    return NextResponse.rewrite(new URL("/403", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-firm-id", userFirmId || "");
  requestHeaders.set("x-user-role", userRole);
  requestHeaders.set("x-user-id", token.sub ?? "");

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ["/dashboard/:path*"] };
