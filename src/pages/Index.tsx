import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { AddTaskDialog } from "@/components/kanban/AddTaskDialog";
import { useTasks } from "@/hooks/useTasks";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileSidebar } from "@/components/layout/MobileSidebar";

export default function Index() {
  const { user, loading } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { addTask } = useTasks();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="flex min-h-screen bg-background w-full">
      {/* Desktop Sidebar */}
      {!isMobile && <AppSidebar onCreateTask={addTask} />}
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        open={mobileMenuOpen} 
        onOpenChange={setMobileMenuOpen} 
        onCreateTask={addTask}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header - only on mobile */}
        {isMobile && (
          <MobileHeader 
            onMenuClick={() => setMobileMenuOpen(true)}
            onAddClick={() => setAddOpen(true)}
          />
        )}

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">BBM Board</h1>
            <p className="text-sm text-muted-foreground">Manage your tasks with drag & drop</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search tasks..." className="pl-9 w-64 bg-secondary/50 border-border" />
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-primary text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </div>
        </header>

        <KanbanBoard />

        <AddTaskDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addTask} />
      </main>
    </div>
  );
}
