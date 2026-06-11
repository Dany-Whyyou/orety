import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Convention `middleware` (edge) conservée au lieu de `proxy` (Node only) :
// @opennextjs/cloudflare ne supporte pas le proxy Node de Next 16.
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon / logo assets
     * - public images
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
