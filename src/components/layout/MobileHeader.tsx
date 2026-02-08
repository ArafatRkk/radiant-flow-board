import { Button } from "@/components/ui/button";
import { Menu, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface MobileHeaderProps {
  onMenuClick: () => void;
  onAddClick: () => void;
}

export function MobileHeader({ onMenuClick, onAddClick }: MobileHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border md:hidden">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        {!showSearch && (
          <div>
            <h1 className="text-lg font-bold font-display text-foreground">Arafat Board</h1>
          </div>
        )}
      </div>

      {showSearch ? (
        <div className="flex-1 flex items-center gap-2 ml-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-9 bg-secondary/50 border-border w-full"
              autoFocus
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
            <Search className="w-5 h-5" />
          </Button>
          <Button size="icon" onClick={onAddClick} className="bg-primary text-primary-foreground">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      )}
    </header>
  );
}
