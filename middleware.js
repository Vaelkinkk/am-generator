import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();

  if (url.pathname === '/login') {
    url.pathname = '/';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login'],
};
