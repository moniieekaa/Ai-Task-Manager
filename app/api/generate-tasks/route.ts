import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json()

    if (!topic) {
      return NextResponse.json({ message: "Topic is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: `Generate exactly 5 concise, actionable tasks to help someone learn about or accomplish: "${topic}". 

Requirements:
- Each task should be specific and actionable
- Tasks should be realistic and achievable
- Return only the tasks, one per line
- No numbering, bullets, or extra formatting
- Each task should be a complete sentence

Example format:
Research the fundamentals of Python programming
Set up a Python development environment
Complete a beginner Python tutorial
Build a simple calculator project
Join a Python community or forum`,
    })

    // Parse the generated text into individual tasks
    const tasks = text
      .split("\n")
      .map((task) => task.trim())
      .filter((task) => task.length > 0)
      .slice(0, 5) // Ensure we only get 5 tasks

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Task generation error:", error)
    return NextResponse.json({ message: "Failed to generate tasks" }, { status: 500 })
  }
}
