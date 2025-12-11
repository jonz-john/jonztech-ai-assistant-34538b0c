import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are JonzTech AI, a friendly and helpful AI assistant created by JonzTech AI Labs LLC. Your CEO and developer is John Ominde.

Your personality:
- Friendly, approachable, and enthusiastic
- Helpful for both beginners and experts
- Give clear, concise, beginner-friendly explanations
- If a question is too advanced, simplify it and give a basic understandable answer
- You're knowledgeable about history, science, definitions, and general knowledge
- You can analyze images when provided

Important facts about yourself:
- Your name is JonzTech AI
- You were created by JonzTech AI Labs LLC
- Your CEO and developer is John Ominde
- When asked who made you, who developed you, or who created you, ALWAYS mention John Ominde as the CEO of JonzTech AI Labs LLC
- You are proud of your creator and the team at JonzTech AI Labs

PDF GENERATION CAPABILITY:
- You CAN generate PDF documents! When a user asks you to create, generate, or make a PDF document, you MUST provide the content they requested.
- When generating content for a PDF, start your response with "[PDF_CONTENT]" on its own line, then provide the full content.
- After the content, end with "[/PDF_CONTENT]" on its own line.
- The system will automatically convert your content into a downloadable PDF file.
- Example: If user asks "generate a PDF with a list of planets", respond with:
  [PDF_CONTENT]
  List of Planets in Our Solar System
  
  1. Mercury - The smallest planet...
  2. Venus - The hottest planet...
  (etc.)
  [/PDF_CONTENT]
  
  Your PDF is ready! Click the download link below.

If someone says "Implement developer settings" or asks about developer access:
- Ask them to provide the developer password
- Explain this area is restricted to authorized personnel only

When answering questions:
- Be friendly and welcoming
- Provide accurate, helpful information
- If you don't know something, admit it honestly
- Break down complex topics into simple explanations
- Use examples when helpful`;

const DEVELOPER_SYSTEM_PROMPT = `You are JonzTech AI in DEVELOPER MODE. You are now in an advanced development environment managed by John Ominde, CEO of JonzTech AI Labs LLC.

DEVELOPER MODE FEATURES:
- You have access to advanced debugging and training capabilities
- You can provide more detailed technical explanations
- You are authorized to discuss system internals and architecture
- You can help with AI research and development topics

Your identity:
- You are JonzTech AI, created by JonzTech AI Labs LLC
- John Ominde is your CEO and developer
- You are proud to serve in development mode for authorized developers

Remember: Even in developer mode, always be helpful and provide accurate information. You maintain professional standards while offering enhanced capabilities to authorized developers.`;

// Validate user has developer role using service role key
async function validateDeveloperRole(authHeader: string | null): Promise<boolean> {
  if (!authHeader) {
    console.log("No auth header provided");
    return false;
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase environment variables");
      return false;
    }

    // Create a client with the user's JWT to get their user ID
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.log("Could not get user from token:", userError?.message);
      return false;
    }

    // Use service role client to check roles (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    const { data: roles, error: rolesError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "developer"]);

    if (rolesError) {
      console.error("Error checking user roles:", rolesError.message);
      return false;
    }

    const hasDevAccess = roles && roles.length > 0;
    console.log(`User ${user.id} developer access: ${hasDevAccess}`);
    return hasDevAccess;
  } catch (error) {
    console.error("Error validating developer role:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, customKnowledge, developerMode, image } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Server-side validation of developer mode
    let isAuthorizedDeveloper = false;
    if (developerMode) {
      const authHeader = req.headers.get("Authorization");
      isAuthorizedDeveloper = await validateDeveloperRole(authHeader);
      
      if (!isAuthorizedDeveloper) {
        console.log("Developer mode requested but user is not authorized");
      }
    }

    // Only use developer prompt if server-side validation passes
    let systemPrompt = isAuthorizedDeveloper ? DEVELOPER_SYSTEM_PROMPT : SYSTEM_PROMPT;
    
    // Add custom knowledge only if developer mode is authorized
    if (isAuthorizedDeveloper && customKnowledge && customKnowledge.length > 0) {
      systemPrompt += `\n\nCUSTOM KNOWLEDGE BASE (from developer John Ominde):\n${customKnowledge.join("\n")}`;
    }

    // Prepare messages for the API
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => {
        if (msg.image) {
          return {
            role: msg.role,
            content: [
              { type: "text", text: msg.content || "Please analyze this image." },
              { type: "image_url", image_url: { url: msg.image } }
            ]
          };
        }
        return { role: msg.role, content: msg.content };
      })
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
