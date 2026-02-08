import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Task } from "@/hooks/useTasks";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Edit2, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const priorityConfig = {
  high: { label: "High", className: "bg-destructive/20 text-destructive border-destructive/30" },
  medium: { label: "Medium", className: "bg-warning/20 text-warning border-warning/30" },
  low: { label: "Low", className: "bg-success/20 text-success border-success/30" },
};

interface TaskCardProps {
  task: Task;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, index, onDelete, onEdit }: TaskCardProps) {
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
        >
          <Card
            className={`p-3 sm:p-4 bg-card border-border hover:border-primary/30 transition-all duration-200 cursor-grab active:cursor-grabbing group ${
              snapshot.isDragging ? "shadow-xl shadow-primary/20 rotate-2 scale-105" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <Badge variant="outline" className={`text-xs ${priority.className}`}>
                {priority.label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border">
                  <DropdownMenuItem onClick={() => onEdit(task)} className="gap-2">
                    <Edit2 className="h-3 w-3" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(task.id)} className="gap-2 text-destructive">
                    <Trash2 className="h-3 w-3" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <h4 className="font-semibold text-sm text-foreground mb-1 break-words">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3 break-words">{task.description}</p>
            )}

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.created_at), "MMM d, yyyy")}</span>
            </div>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
