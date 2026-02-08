import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Bot,
  LogOut,
  Upload,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AIChatSidebar } from "./AIChatSidebar";

interface AppSidebarProps {
  onCreateTask?: (title: string, description: string, priority: string, status: string) => Promise<void>;
}

export function AppSidebar({ onCreateTask }: AppSidebarProps) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"board" | "ai">("board");
  const [collapsed, setCollapsed] = useState(false);
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
      // Add cache-busting timestamp to force refresh
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

  return (
    <div
      className={`flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
        collapsed ? "w-16" : activeTab === "ai" ? "w-[380px]" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold font-display text-foreground">BBM Board</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-sidebar-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Nav */}
      <div className="p-2 space-y-1">
        <Button
          variant={activeTab === "board" ? "secondary" : "ghost"}
          className={`w-full ${collapsed ? "justify-center px-2" : "justify-start"} ${
            activeTab === "board" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
          }`}
          onClick={() => setActiveTab("board")}
        >
          <LayoutDashboard className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Board</span>}
        </Button>
        <Button
          variant={activeTab === "ai" ? "secondary" : "ghost"}
          className={`w-full ${collapsed ? "justify-center px-2" : "justify-start"} ${
            activeTab === "ai" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
          }`}
          onClick={() => { setActiveTab("ai"); if (collapsed) setCollapsed(false); }}
        >
          <Bot className="w-4 h-4" />
          {!collapsed && <span className="ml-2">AI Chat</span>}
        </Button>
      </div>

      {/* AI Panel */}
      {activeTab === "ai" && !collapsed && (
        <div className="flex-1 overflow-hidden">
          <AIChatSidebar onCreateTask={onCreateTask} />
        </div>
      )}

      {activeTab !== "ai" && <div className="flex-1" />}

      {/* Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="relative group">
            <Avatar className="h-9 w-9 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">{initials}</AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Upload className="w-3 h-3 text-foreground" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
