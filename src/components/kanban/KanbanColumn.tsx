import { Droppable } from "@hello-pangea/dnd";
import { Task } from "@/hooks/useTasks";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const columnConfig = {
  todo: {
    title: "To Do",
    icon: "📋",
    accentClass: "border-t-info",
    countBg: "bg-info/20 text-info",
  },
  in_progress: {
    title: "In Progress",
    icon: "🔥",
    accentClass: "border-t-warning",
    countBg: "bg-warning/20 text-warning",
  },
  done: {
    title: "Done",
    icon: "✅",
    accentClass: "border-t-success",
    countBg: "bg-success/20 text-success",
  },
};

interface KanbanColumnProps {
  status: string;
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onAddTask: (status: string) => void;
}

export function KanbanColumn({ status, tasks, onDelete, onEdit, onAddTask }: KanbanColumnProps) {
  const config = columnConfig[status as keyof typeof columnConfig];

  return (
    <div className={`flex flex-col bg-secondary/30 rounded-xl border border-border border-t-4 ${config.accentClass} min-w-[280px] w-[280px] sm:min-w-[300px] sm:w-[320px] md:min-w-[300px] md:w-[340px] shrink-0`}>
      <div className="flex items-center justify-between p-3 sm:p-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">{config.icon}</span>
          <h3 className="font-semibold font-display text-foreground text-sm sm:text-base">{config.title}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.countBg}`}>
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary"
          onClick={() => onAddTask(status)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 sm:p-3 pt-1 min-h-[150px] sm:min-h-[200px] transition-colors duration-200 ${
              snapshot.isDraggingOver ? "bg-primary/5" : ""
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} onDelete={onDelete} onEdit={onEdit} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
