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
    <header className="flex items-center justify-between px-4 py-3 border-b border-border md:hidden bg-background h-14">
      {showSearch ? (
        <div className="flex items-center w-full gap-2 animate-in fade-in zoom-in duration-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-9 bg-secondary/50 border-border w-full h-9"
              autoFocus
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(false)} className="h-9 w-9 shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-9 w-9 -ml-2">
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <LayoutDashboard className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-bold font-display text-foreground text-lg">BBM Board</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)} className="h-9 w-9">
              <Search className="w-5 h-5" />
            </Button>
            <Button onClick={onAddClick} size="sm" className="bg-primary text-primary-foreground h-8 w-8 p-0 rounded-full">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </>
      )}
    </header>
  );
}
