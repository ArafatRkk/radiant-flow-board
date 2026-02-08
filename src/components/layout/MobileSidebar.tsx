import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LayoutDashboard, Bot, LogOut, Upload, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AIChatSidebar } from "@/components/sidebar/AIChatSidebar";
import { useState } from "react";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask?: (title: string, description: string, priority: string, status: string) => Promise<void>;
}

export function MobileSidebar({ open, onOpenChange, onCreateTask }: MobileSidebarProps) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"board" | "ai">("board");
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrlWithCache = `${publicUrl}?t=${Date.now()}`;

      await supabase.from("profiles").update({ avatar_url: avatarUrlWithCache }).eq("user_id", user.id);
      toast.success("Profile picture updated!");
      await refreshProfile();
    } catch (err: any) {
      toast.error("Failed to upload avatar");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const displayName = profile?.display_name || user?.email || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSignOut = () => {
    onOpenChange(false);
    signOut();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[90vw] max-w-[320px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
              </div>
              <SheetTitle className="font-bold font-display text-foreground text-base">BBM Board</SheetTitle>
            </div>
          </div>
        </SheetHeader>

        {/* Nav */}
        <div className="p-2 space-y-1 border-b border-border">
          <Button
            variant={activeTab === "board" ? "secondary" : "ghost"}
            className={`w-full justify-start ${activeTab === "board" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
              }`}
            onClick={() => {
              setActiveTab("board");
              onOpenChange(false);
            }}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Board
          </Button>
          <Button
            variant={activeTab === "ai" ? "secondary" : "ghost"}
            className={`w-full justify-start ${activeTab === "ai" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
              }`}
            onClick={() => setActiveTab("ai")}
          >
            <Bot className="w-4 h-4 mr-2" />
            AI Chat
          </Button>
        </div>

        {/* AI Panel */}
        {activeTab === "ai" && (
          <div className="flex-1 overflow-hidden">
            <AIChatSidebar onCreateTask={onCreateTask} />
          </div>
        )}

        {activeTab !== "ai" && <div className="flex-1" />}

        {/* Profile */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity cursor-pointer">
                <Upload className="w-3 h-3 text-foreground" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
