import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Sparkles, Loader2, Mic, MicOff, Volume2, VolumeX, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

interface TaskCreationData {
  title: string;
  description?: string;
  status?: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
}

interface AIChatSidebarProps {
  onCreateTask?: (title: string, description: string, priority: string, status: string) => Promise<void>;
}

export function AIChatSidebar({ onCreateTask }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, isSupported: voiceSupported, toggleListening, setTranscript } = useVoiceRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, isSupported: ttsSupported } = useTextToSpeech();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Auto-send when voice recognition stops and we have a transcript
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      const timer = setTimeout(() => {
        if (transcript.trim()) {
          sendMessage(transcript);
          setTranscript("");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, transcript]);

  const handleToolCall = async (toolCall: any) => {
    if (toolCall.function.name === "create_task" && onCreateTask) {
      try {
        const args: TaskCreationData = JSON.parse(toolCall.function.arguments);
        const title = args.title;
        const description = args.description || "";
        const priority = args.priority || "medium";
        const status = args.status || "todo";

        await onCreateTask(title, description, priority, status);

        const statusLabels: Record<string, string> = {
          todo: "To Do",
          in_progress: "In Progress",
          done: "Done"
        };

        toast.success(`টাস্ক তৈরি হয়েছে! (Task created!)`, {
          description: `"${title}" → ${statusLabels[status]}`
        });

        return {
          success: true,
          message: `টাস্ক "${title}" সফলভাবে ${statusLabels[status]} এ যোগ করা হয়েছে! (Task "${title}" successfully added to ${statusLabels[status]}!)`
        };
      } catch (error) {
        console.error("Failed to create task:", error);
        return {
          success: false,
          message: "টাস্ক তৈরি করতে সমস্যা হয়েছে। (Failed to create task.)"
        };
      }
    }
    return null;
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;
    
    const userMsg: Msg = { role: "user", content: textToSend };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { messages: allMessages },
      });

      if (error) throw error;

      const choice = data?.choices?.[0];
      let assistantContent = "";

      // Check if there's a tool call
      if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
        const toolCall = choice.message.tool_calls[0];
        const toolResult = await handleToolCall(toolCall);
        
        if (toolResult) {
          assistantContent = toolResult.message;
        } else {
          assistantContent = choice?.message?.content || "টাস্ক প্রসেস করা হচ্ছে... (Processing task...)";
        }
      } else {
        assistantContent = choice?.message?.content || data?.content || "দুঃখিত, বুঝতে পারিনি। (Sorry, I couldn't understand that.)";
      }

      setMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);
      
      // Auto-speak the response if enabled
      if (autoSpeak && ttsSupported) {
        speak(assistantContent);
      }
    } catch (e: any) {
      console.error("Chat error:", e);
      const errorMsg = "দুঃখিত, কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন। (Sorry, something went wrong. Please try again.)";
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: errorMsg },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    toggleListening();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold font-display text-foreground text-sm">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">বাংলা ও English • টাস্ক তৈরি</p>
            </div>
          </div>
          {ttsSupported && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${autoSpeak ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setAutoSpeak(!autoSpeak)}
              title={autoSpeak ? "Voice replies on" : "Voice replies off"}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">AI এর সাথে কথা বলুন</p>
            <p className="text-xs mt-2 opacity-70">🎤 মাইক বাটন চেপে বলুন:</p>
            <div className="mt-3 space-y-1 text-xs">
              <p className="bg-secondary/50 rounded-lg px-3 py-1.5 inline-block">"একটা টাস্ক তৈরি করো"</p>
              <p className="bg-secondary/50 rounded-lg px-3 py-1.5 inline-block">"Add a task to In Progress"</p>
              <p className="bg-secondary/50 rounded-lg px-3 py-1.5 inline-block">"High priority টাস্ক করো"</p>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-3.5 h-3.5 text-accent" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        {/* Voice status indicator */}
        {isListening && (
          <div className="mb-2 flex items-center gap-2 text-xs text-primary animate-pulse">
            <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
            শুনছি... (Listening...)
          </div>
        )}
        {isSpeaking && (
          <div className="mb-2 flex items-center gap-2 text-xs text-accent">
            <Volume2 className="w-3 h-3 animate-pulse" />
            বলছে... (Speaking...)
          </div>
        )}
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="বাংলা বা English এ লিখুন..."
            className="bg-secondary/50 border-border"
            disabled={isLoading || isListening}
          />
          {voiceSupported && (
            <Button
              type="button"
              size="icon"
              variant={isListening ? "destructive" : "secondary"}
              onClick={handleVoiceToggle}
              disabled={isLoading}
              className={`shrink-0 ${isListening ? "animate-pulse" : ""}`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          )}
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-primary text-primary-foreground shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
