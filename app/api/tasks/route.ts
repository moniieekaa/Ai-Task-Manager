import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

async function getUserFromToken() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    throw new Error("Not authenticated")
  }

  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
  return decoded.userId
}

export async function GET() {
  try {
    const userId = await getUserFromToken()

    const tasks = await sql`
      SELECT id, title, description, category, completed, created_at, user_id
      FROM tasks 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json({ message: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken()
    const { title, description, category } = await request.json()

    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 })
    }

    const newTask = await sql`
      INSERT INTO tasks (title, description, category, completed, user_id)
      VALUES (${title}, ${description || null}, ${category || "personal"}, false, ${userId})
      RETURNING id, title, description, category, completed, created_at, user_id
    `

    return NextResponse.json(newTask[0])
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ message: "Failed to create task" }, { status: 500 })
  }
}
