import { NextResponse, type NextRequest } from 'next/server'

// 認証なし運用のため、すべてのリクエストをそのまま通す
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
