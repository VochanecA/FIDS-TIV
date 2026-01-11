import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Proverite da li je to admin ruta
  const isAdminRoute = path.startsWith('/admin');
  const isLoginPage = path === '/admin/login';
  
  // Ako pristupate login stranici i već ste ulogovani, redirect na admin dashboard
  if (isLoginPage) {
    const isAuthenticated = request.cookies.get('admin-authenticated')?.value === 'true';
    
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }
  
  // Ako pristupate admin ruti koja nije login stranica
  if (isAdminRoute && !isLoginPage) {
    const isAuthenticated = request.cookies.get('admin-authenticated')?.value === 'true';
    
    if (!isAuthenticated) {
      // Redirect na login stranicu
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}

// Konfigurišite koje rute treba da budu zaštićene
export const config = {
  matcher: ['/admin/:path*']
};