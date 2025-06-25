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

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken()
    const { tasks } = await request.json()

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ message: "Tasks array is required" }, { status: 400 })
    }

    // Insert all tasks
    const insertPromises = tasks.map(
      (task) =>
        sql`
        INSERT INTO tasks (title, description, category, completed, user_id)
        VALUES (${task.title}, ${task.description || null}, ${task.category || "personal"}, ${task.completed || false}, ${userId})
      `,
    )

    await Promise.all(insertPromises)

    return NextResponse.json({ message: "Tasks created successfully" })
  } catch (error) {
    console.error("Bulk create tasks error:", error)
    return NextResponse.json({ message: "Failed to create tasks" }, { status: 500 })
  }
}
