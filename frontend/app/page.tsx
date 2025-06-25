"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useUser, useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Edit, Plus, Sparkles, Target, CheckCircle, Clock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Task {
  id: string
  title: string
  description?: string
  category: string
  completed: boolean
  createdAt: string
  updatedAt: string
  userId: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export default function TaskManager() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [generatingTasks, setGeneratingTasks] = useState(false)
  const [topic, setTopic] = useState("")
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState({ title: "", description: "", category: "personal" })
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [authToken, setAuthToken] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (user && isLoaded) {
      syncUser()
    }
  }, [user, isLoaded])

  useEffect(() => {
    if (authToken) {
      fetchTasks()
    }
  }, [authToken])

  const syncUser = async () => {
    if (!user) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          name: user.fullName || user.firstName || "User",
        }),
      })

      if (response.ok) {
        const { token } = await response.json()
        setAuthToken(token)
      }
    } catch (error) {
      console.error("Failed to sync user:", error)
      toast({
        title: "Error",
        description: "Failed to sync user. Please refresh the page.",
        variant: "destructive",
      })
    }
  }

  const getAuthHeaders = () => {
    return {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    }
  }

  const fetchTasks = async () => {
    if (!authToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const tasksData = await response.json()
        setTasks(tasksData)
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
      toast({
        title: "Error",
        description: "Failed to fetch tasks. Please try again.",
        variant: "destructive",
      })
    }
  }

  const generateTasks = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic to generate tasks.",
        variant: "destructive",
      })
      return
    }

    if (!authToken) {
      toast({
        title: "Authentication required",
        description: "Please wait for authentication to complete.",
        variant: "destructive",
      })
      return
    }

    setGeneratingTasks(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-tasks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ topic }),
      })

      if (response.ok) {
        const { tasks: aiTasks } = await response.json()
        setGeneratedTasks(aiTasks)
        toast({
          title: "Tasks generated!",
          description: `Generated ${aiTasks.length} tasks for "${topic}"`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate tasks")
      }
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate tasks. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGeneratingTasks(false)
    }
  }

  const saveTasks = async () => {
    if (generatedTasks.length === 0 || !authToken) return

    setLoading(true)
    try {
      const tasksToSave = generatedTasks.map((task) => ({
        title: task,
        category: "learning",
      }))

      const response = await fetch(`${API_BASE_URL}/api/tasks/bulk`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ tasks: tasksToSave }),
      })

      if (response.ok) {
        await fetchTasks()
        setGeneratedTasks([])
        setTopic("")
        toast({
          title: "Tasks saved!",
          description: `Successfully saved ${tasksToSave.length} tasks.`,
        })
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save tasks. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title.trim() || !authToken) return

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newTask),
      })

      if (response.ok) {
        await fetchTasks()
        setNewTask({ title: "", description: "", category: "personal" })
        toast({
          title: "Task created!",
          description: "Your new task has been added.",
        })
      }
    } catch (error) {
      toast({
        title: "Creation failed",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!authToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        await fetchTasks()
        setEditingTask(null)
        toast({
          title: "Task updated!",
          description: "Your task has been successfully updated.",
        })
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!authToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        await fetchTasks()
        toast({
          title: "Task deleted!",
          description: "Your task has been removed.",
        })
      }
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleTaskCompletion = async (task: Task) => {
    await updateTask(task.id, { completed: !task.completed })
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "completed" && task.completed) ||
      (filter === "pending" && !task.completed) ||
      filter === task.category

    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesFilter && matchesSearch
  })

  const completedTasks = tasks.filter((task) => task.completed).length
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const categories = ["personal", "work", "learning", "health", "finance"]

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Task Manager AI</CardTitle>
            <CardDescription>Generate and manage tasks with AI assistance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">Please sign in to continue</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-8 h-8 text-indigo-600" />
              Task Manager AI
            </h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.firstName}!</p>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  {completedTasks} of {totalTasks} tasks completed
                </span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{totalTasks}</div>
                  <div className="text-sm text-gray-600">Total Tasks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{totalTasks - completedTasks}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Manage Tasks
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Task
            </TabsTrigger>
          </TabsList>

          {/* AI Task Generation */}
          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Generate Tasks with AI
                </CardTitle>
                <CardDescription>
                  Enter a topic and let Google Gemini AI generate actionable tasks for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a topic (e.g., 'Learn Python', 'Plan vacation', 'Improve fitness')"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && generateTasks()}
                  />
                  <Button onClick={generateTasks} disabled={generatingTasks || !topic.trim() || !authToken}>
                    {generatingTasks ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>

                {generatedTasks.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Generated Tasks</h3>
                      <Button onClick={saveTasks} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save All Tasks"
                        )}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {generatedTasks.map((task, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-sm">{task}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Task Management */}
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Your Tasks</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                  />
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tasks</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks found. Create some tasks or generate them with AI!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 border rounded-lg transition-all ${
                          task.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => toggleTaskCompletion(task)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <h3 className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className={`text-sm mt-1 ${task.completed ? "text-gray-400" : "text-gray-600"}`}>
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {task.category}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(task.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setEditingTask(task)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTask(task.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Task */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Task</CardTitle>
                <CardDescription>Add a custom task to your list</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createTask} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter task title..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Add more details about this task..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newTask.category}
                      onValueChange={(value) => setNewTask((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={loading || !newTask.title.trim() || !authToken}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Task"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Task Dialog */}
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            {editingTask && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Task Title</Label>
                  <Input
                    id="edit-title"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingTask.description || ""}
                    onChange={(e) => setEditingTask((prev) => (prev ? { ...prev, description: e.target.value } : null))}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingTask.category}
                    onValueChange={(value) => setEditingTask((prev) => (prev ? { ...prev, category: value } : null))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  editingTask &&
                  updateTask(editingTask.id, {
                    title: editingTask.title,
                    description: editingTask.description,
                    category: editingTask.category,
                  })
                }
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
