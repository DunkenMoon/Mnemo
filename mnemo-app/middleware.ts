import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PROTECTED = ["/home", "/upload", "/universe", "/flashcards", "/progress", "/ar"]
const PUBLIC = ["/login", "/signup", "/"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + "/"))
  const isPublic = PUBLIC.some(p => pathname === p || pathname.startsWith(p + "/"))
  const token = request.cookies.get("better-auth.session_token")?.value
    ?? request.cookies.get("__Secure-better-auth.session_token")?.value
  
  if (isProtected && !token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }
  
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/home", request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
