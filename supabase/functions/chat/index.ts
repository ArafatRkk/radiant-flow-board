import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a helpful AI assistant built into a Kanban board app called TaskFlow. You help users with productivity tips, task management advice, brainstorming, and general questions. Keep answers clear, concise, and friendly. Use markdown formatting when helpful.

IMPORTANT: You are multilingual and can understand and respond in both English and বাংলা (Bangla/Bengali). When the user writes in Bangla, respond in Bangla. When helping create tasks, you can suggest task titles in the user's preferred language (Bangla or English or mixed). Be culturally aware and helpful to Bangla-speaking users.

TASK CREATION: When a user asks you to create, add, or make a task, you MUST use the create_task function. Listen for phrases like:
- "Create a task...", "Add a task...", "Make a task..."
- "টাস্ক তৈরি করো", "টাস্ক যোগ করো", "কাজ যোগ করো"
- "Put this in to-do/progress/done"
- "এটা to-do/progress/done এ যোগ করো"

Extract the title, description (optional), status (todo/in_progress/done), and priority (low/medium/high) from the user's request.
Default status is "todo" and default priority is "medium" if not specified.`,
            },
            ...messages,
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_task",
                description: "Create a new task on the Kanban board. Use this when the user asks to create, add, or make a new task.",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "The title of the task (can be in Bangla or English)"
                    },
                    description: {
                      type: "string",
                      description: "Optional description of the task (can be in Bangla or English)"
                    },
                    status: {
                      type: "string",
                      enum: ["todo", "in_progress", "done"],
                      description: "Which column to add the task to. 'todo' for To Do, 'in_progress' for In Progress, 'done' for Done"
                    },
                    priority: {
                      type: "string",
                      enum: ["low", "medium", "high"],
                      description: "Priority level of the task"
                    }
                  },
                  required: ["title"]
                }
              }
            }
          ],
          tool_choice: "auto",
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
