import { Button } from "@/components/ui/button";
import { Menu, Plus, Search, X, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface MobileHeaderProps {
  onMenuClick: () => void;
  onAddClick: () => void;
}

export function MobileHeader({ onMenuClick, onAddClick }: MobileHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="flex flex-col gap-3 px-4 py-3 border-b border-border md:hidden">
      {/* Top Row: Menu + Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-9 w-9">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold font-display text-foreground">Arafat Board</h1>
          </div>
        </div>
      </div>

      {/* Middle Row: Search */}
      <div className="relative w-full">
        {showSearch ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-9 bg-secondary/50 border-border w-full h-10"
                autoFocus
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(false)} className="h-9 w-9 shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground bg-secondary/50 border-border h-10"
            onClick={() => setShowSearch(true)}
          >
            <Search className="w-4 h-4 mr-2" />
            Search tasks...
          </Button>
        )}
      </div>

      {/* Bottom Row: New Task Button */}
      <Button 
        onClick={onAddClick} 
        className="w-full bg-primary text-primary-foreground gap-2 h-10"
      >
        <Plus className="w-4 h-4" />
        New Task
      </Button>
    </header>
  );
}
