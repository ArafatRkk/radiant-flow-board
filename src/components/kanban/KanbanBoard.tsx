import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useTasks, Task } from "@/hooks/useTasks";
import { KanbanColumn } from "./KanbanColumn";
import { AddTaskDialog } from "./AddTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
import { Skeleton } from "@/components/ui/skeleton";

const COLUMNS = ["todo", "in_progress", "done"];

export function KanbanBoard() {
  const { tasks, loading, addTask, updateTask, deleteTask, moveTask } = useTasks();
  const [addOpen, setAddOpen] = useState(false);
  const [addStatus, setAddStatus] = useState("todo");
  const [editTask, setEditTask] = useState<Task | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    moveTask(draggableId, destination.droppableId, destination.index);
  };

  const handleAddTask = (status: string) => {
    setAddStatus(status);
    setAddOpen(true);
  };

  if (loading) {
    return (
      <div className="flex gap-6 p-6 overflow-x-auto">
        {COLUMNS.map(c => (
          <div key={c} className="min-w-[300px] w-[340px] space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 overflow-x-auto flex-1 pb-6">
          {COLUMNS.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position)}
              onDelete={deleteTask}
              onEdit={setEditTask}
              onAddTask={handleAddTask}
            />
          ))}
        </div>
      </DragDropContext>

      <AddTaskDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={addTask}
        defaultStatus={addStatus}
      />

      <EditTaskDialog
        task={editTask}
        open={!!editTask}
        onOpenChange={(open) => !open && setEditTask(null)}
        onUpdate={updateTask}
      />
    </>
  );
}
