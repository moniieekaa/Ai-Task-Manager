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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getUserFromToken()
    const updates = await request.json()

    // Verify task belongs to user
    const existingTask = await sql`
      SELECT id FROM tasks WHERE id = ${id} AND user_id = ${userId}
    `

    if (existingTask.length === 0) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 })
    }

    // Build update query dynamically
    const updateFields = []
    const values = []

    if (updates.title !== undefined) {
      updateFields.push("title = $" + (values.length + 1))
      values.push(updates.title)
    }
    if (updates.description !== undefined) {
      updateFields.push("description = $" + (values.length + 1))
      values.push(updates.description)
    }
    if (updates.category !== undefined) {
      updateFields.push("category = $" + (values.length + 1))
      values.push(updates.category)
    }
    if (updates.completed !== undefined) {
      updateFields.push("completed = $" + (values.length + 1))
      values.push(updates.completed)
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ message: "No valid fields to update" }, { status: 400 })
    }

    values.push(id, userId)

    const updatedTask = await sql`
      UPDATE tasks 
      SET ${sql.unsafe(updateFields.join(", "))}
      WHERE id = $${values.length - 1} AND user_id = $${values.length}
      RETURNING id, title, description, category, completed, created_at, user_id
    `.apply(null, values)

    return NextResponse.json(updatedTask[0])
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ message: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getUserFromToken()

    const deletedTask = await sql`
      DELETE FROM tasks 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `

    if (deletedTask.length === 0) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ message: "Failed to delete task" }, { status: 500 })
  }
}
