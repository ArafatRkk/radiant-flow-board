import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  position: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true });
    if (error) {
      toast.error("Failed to load tasks");
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (title: string, description: string, priority: string, status: string = "todo") => {
    if (!user) return;
    const maxPos = tasks.filter(t => t.status === status).reduce((max, t) => Math.max(max, t.position), -1);
    const { error } = await supabase.from("tasks").insert({
      title,
      description,
      priority,
      status,
      position: maxPos + 1,
      user_id: user.id,
    });
    if (error) {
      toast.error("Failed to add task");
    } else {
      toast.success("Task added!");
      fetchTasks();
    }
  };

  const updateTask = async (id: string, updates: Partial<Omit<Task, "id" | "user_id" | "created_at" | "updated_at">>) => {
    const { error } = await supabase.from("tasks").update(updates).eq("id", id);
    if (error) {
      toast.error("Failed to update task");
    } else {
      fetchTasks();
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete task");
    } else {
      toast.success("Task deleted");
      fetchTasks();
    }
  };

  const moveTask = async (taskId: string, newStatus: string, newPosition: number) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus, position: newPosition })
      .eq("id", taskId);
    if (error) {
      toast.error("Failed to move task");
    } else {
      fetchTasks();
    }
  };

  return { tasks, loading, addTask, updateTask, deleteTask, moveTask, refetch: fetchTasks };
}
