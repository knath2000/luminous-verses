import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
import { NextResponse } from "next/server"

// Re-export Better Auth handlers but add CORS headers so cross-origin requests from the
// React-Native app (Expo dev & production) succeed. We also answer OPTIONS preflight.
const { GET: _GET, POST: _POST } = toNextJsHandler(auth)

function withCors(res: Response): Response {
  const next = new NextResponse(res.body, res)
  next.headers.set("Access-Control-Allow-Origin", "*")
  next.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  next.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return next
}

export async function GET(req: Request) {
  const res = await _GET(req)
  return withCors(res)
}

export async function POST(req: Request) {
  const res = await _POST(req)
  return withCors(res)
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
} 