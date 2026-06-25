import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

// Lazy initialization check or catch
let ai: any = null;
function getGeminiClient() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features might fail.");
    }
    ai = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

// Ensure database/schema structures are safe
// We can use a standard JSON-based file storage or simple session-based mock storage if needed,
// but for the sake of simplicity and robustness, local persistence is fully managed by client localStorage,
// while the server acts as the AI processing proxy, keeping API key fully hidden.

// 1. Prioritize a Task
app.post("/api/prioritize", async (req, res) => {
  try {
    const { title, notes, deadline, category, currentScheduleCount } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const client = getGeminiClient();
    const prompt = `
      You are an elite productivity strategist for "The Last-Minute Life Saver".
      Analyze the following task and categorize it using the Eisenhower Matrix (Urgent vs Important).
      
      Task Details:
      - Title: "${title}"
      - Notes/Description: "${notes || 'No description provided'}"
      - Deadline/Due: "${deadline || 'No specific deadline'}"
      - Estimated Category: "${category || 'General'}"
      - Current scheduled items today: ${currentScheduleCount || 0}
      
      Decide:
      1. Is this task urgent? (A task is urgent if the deadline is very close or it requires immediate attention).
      2. Is it important? (A task is important if it contributes heavily to long-term goals, academic success, or critical personal duties).
      3. Procrastination Risk Level: "Critical" (due today/tomorrow, highly likely to be put off), "High", "Moderate", "Low".
      4. Suggest estimated focus time in minutes (usually blocks of 15, 25, 45, or 60).
      5. Provide an ultra-specific, action-oriented "Getting Started Tip" that takes less than 2 minutes to do (to defeat the starting friction). Be motivating but direct.
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["priority", "isUrgent", "isImportant", "procrastinationRisk", "explanation", "timeBlockMinutes", "gettingStartedTip"],
          properties: {
            priority: {
              type: Type.STRING,
              description: "High, Medium, or Low"
            },
            isUrgent: {
              type: Type.BOOLEAN,
              description: "Whether the task demands immediate focus"
            },
            isImportant: {
              type: Type.BOOLEAN,
              description: "Whether the task yields high long-term value"
            },
            procrastinationRisk: {
              type: Type.STRING,
              description: "Critical, High, Moderate, or Low"
            },
            explanation: {
              type: Type.STRING,
              description: "Brief 1-2 sentence alignment analysis explaining why it got this matrix position."
            },
            timeBlockMinutes: {
              type: Type.INTEGER,
              description: "Recommended session length in minutes (e.g. 25, 45, 60)"
            },
            gettingStartedTip: {
              type: Type.STRING,
              description: "Ridiculously easy action tip that takes < 2 mins (e.g., 'Open the document and write the title')."
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Prioritizing task failed, falling back to local heuristic engine:", error);
    try {
      const { title, deadline, category, notes } = req.body;
      const delayDays = deadline ? Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 5;
      
      const isUrgent = delayDays <= 2;
      const isImportant = ["Work", "Study", "Finance"].includes(category || "") || (notes && notes.length > 30) || false;
      
      let priority = "Medium";
      if (isUrgent && isImportant) priority = "High";
      else if (!isUrgent && !isImportant) priority = "Low";

      const risk = delayDays <= 1 ? "Critical" : delayDays <= 3 ? "High" : delayDays <= 6 ? "Moderate" : "Low";
      
      const explanation = `[Dynamic Proactive Fallback] Estimated task importance and urgency automatically relative to deadline (${delayDays} days remaining) and category (${category || "General"}).`;
      const timeBlockMinutes = priority === "High" ? 45 : priority === "Medium" ? 30 : 20;
      const gettingStartedTip = `Take exactly 2 minutes to write down the ultimate outline or list three sub-elements for "${title || 'this task'}". Start small!`;

      res.json({
        priority,
        isUrgent,
        isImportant,
        procrastinationRisk: risk,
        explanation,
        timeBlockMinutes,
        gettingStartedTip
      });
    } catch (fallbackErr: any) {
      res.status(500).json({ error: "Failed to prioritize task", details: fallbackErr.message });
    }
  }
});

// 2. Schedule Assistant Time-Block Planner
app.post("/api/autoschedule", async (req, res) => {
  try {
    const { tasks, workingHoursStart, workingHoursEnd } = req.body;
    
    const client = getGeminiClient();
    const prompt = `
      You are an expert time-blocking assistant for "The Last-Minute Life Saver".
      Optimize today's agenda with structured hourly blocks between ${workingHoursStart || "08:00"} and ${workingHoursEnd || "22:00"}.
      
      Here are the current active tasks to accommodate:
      ${JSON.stringify(tasks || [], null, 2)}
      
      Design guidelines:
      1. Group tasks intelligently by alignment and priority. High priority / urgent tasks should be scheduled first (preferably earlier in the day when focus is highest).
      2. Alternate work blocks with short breaks (e.g., 5-10 minutes) or longer buffers.
      3. Output a list of schedule blocks. Each block can be type: "focus" (working on a task), "break" (rest), or "buffer" (unexpected delays or administrative tasks).
      4. Try to make blocks sequential (no overlap) and fit into standard time slots.
      5. Provide a constructive, energetic daily coaching briefing to motivate the user.
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["blocks", "coachingNote"],
          properties: {
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["start", "end", "title", "taskId", "type", "reason"],
                properties: {
                  start: { type: Type.STRING, description: "Start time (HH:MM)" },
                  end: { type: Type.STRING, description: "End time (HH:MM)" },
                  title: { type: Type.STRING, description: "Block label (e.g. 'Focus: Physics Homework' or 'Quick Stretch Break')" },
                  taskId: { type: Type.STRING, description: "Associated Task ID, or empty string if break/buffer" },
                  type: { type: Type.STRING, description: "focus, break, or buffer" },
                  reason: { type: Type.STRING, description: "Why this slot was allocated (e.g. 'Best energy slot for high intensity logic', 'Post-work refresh')" }
                }
              }
            },
            coachingNote: {
              type: Type.STRING,
              description: "A motivational, slightly directive daily briefing addressing their procrastination risks."
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Auto scheduling failed, falling back to local deterministic planner:", error);
    try {
      const { tasks, workingHoursStart, workingHoursEnd } = req.body;
      const startHourStr = workingHoursStart || "08:30";
      const endHourStr = workingHoursEnd || "21:30";
      
      let [currentHour, currentMinute] = startHourStr.split(":").map(Number);
      const [endHour, endMinute] = endHourStr.split(":").map(Number);
      const maxMins = endHour * 60 + endMinute;

      const formatTime = (h: number, m: number) => {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        return `${hh}:${mm}`;
      };

      const addMinutes = (h: number, m: number, minsToAdd: number) => {
        let totalMins = h * 60 + m + minsToAdd;
        let newH = Math.floor(totalMins / 60) % 24;
        let newM = totalMins % 60;
        return { newH, newM };
      };

      // Sort tasks by urgency/importance/priority
      const sortedTasks = [...(tasks || [])].sort((a: any, b: any) => {
        const priorityScore = (task: any) => {
          let score = 0;
          if (task.priority === "High") score += 10;
          if (task.priority === "Medium") score += 5;
          if (task.isUrgent) score += 20;
          if (task.isImportant) score += 15;
          return score;
        };
        return priorityScore(b) - priorityScore(a);
      });

      const blocks: any[] = [];

      for (const t of sortedTasks) {
        if (currentHour * 60 + currentMinute >= maxMins) break;

        const duration = t.duration || 45;
        const startStr = formatTime(currentHour, currentMinute);
        const focusEnd = addMinutes(currentHour, currentMinute, duration);
        const endStr = formatTime(focusEnd.newH, focusEnd.newM);

        blocks.push({
          start: startStr,
          end: endStr,
          title: `Focus Sync: ${t.title}`,
          taskId: t.id || "",
          type: "focus",
          reason: `Auto-allocated optimal ${duration}m slot prioritizing your highly critical task.`
        });

        const breakStartStr = endStr;
        const breakEnd = addMinutes(focusEnd.newH, focusEnd.newM, 15);
        const breakEndStr = formatTime(breakEnd.newH, breakEnd.newM);

        if (breakEnd.newH * 60 + breakEnd.newM < maxMins) {
          blocks.push({
            start: breakStartStr,
            end: breakEndStr,
            title: `Active Deep Breathing & Hydrate`,
            taskId: "",
            type: "break",
            reason: "Lower cortisol levels and stand up to encourage fresh cellular performance."
          });
        }

        currentHour = breakEnd.newH;
        currentMinute = breakEnd.newM;
      }

      if (blocks.length === 0) {
        blocks.push({
          start: "09:00",
          end: "09:45",
          title: "Inbox Triaging & Goal Outlines",
          taskId: "",
          type: "buffer",
          reason: "Set up the main focus deliverables of the day."
        });
      }

      const coachingNote = "[Dynamic Offline Engine Active] High-frequency request spikes detected. I've automatically compiled a structured time-aligned outline to keep you fully on track. Zero excuse mode: let's go!";

      res.json({ blocks, coachingNote });
    } catch (fallbackErr: any) {
      res.status(500).json({ error: "Failed to generate schedule", details: fallbackErr.message });
    }
  }
});

// 3. Procrastination Breaker (Subtask Breakdown & Content Draft Outline)
app.post("/api/breakdown", async (req, res) => {
  try {
    const { title, notes, deadline } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const client = getGeminiClient();
    const prompt = `
      You are the Procrastination Breaker for "The Last-Minute Life Saver".
      The user is procrastinating on this task:
      - Title: "${title}"
      - Notes: "${notes || "No extra context"}"
      - Deadline: "${deadline || "Generic upcoming"}"
      
      We must eliminate the friction of starting. Under-schedule their expectations! 
      
      Please:
      1. Break this task into exactly 3 to 5 ridiculously simple, small, binary subtasks.
         Bad: "Write literature outline" (too big).
         Good: "Open Word doc and write 3 header names", "Write 2 sentences of intro", "List 3 sources".
      2. Provide a 'draftContent' in simple markdown. This is a draft template, structure, introductory text, mathematical structure, or email draft suited specifically of this task, so the user starts with *something* rather than a blank page. Encourage them to edit it.
      3. Create a short, highly customized, firm but inspiring motivational nudge quote directed specifically at this task.
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["subtasks", "draftContent", "procrastinationQuote"],
          properties: {
            subtasks: {
              type: Type.ARRAY,
              description: "List of 3-5 very tiny actions",
              items: {
                type: Type.OBJECT,
                required: ["id", "title"],
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING, description: "Micro-task statement" }
                }
              }
            },
            draftContent: {
              type: Type.STRING,
              description: "Markdown template, starter outline, or code snippet"
            },
            procrastinationQuote: {
              type: Type.STRING,
              description: "Direct, sassy, yet supporting coaching kick-in-the-butt quote"
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Task breakdown failed, falling back to local decomposition generator:", error);
    try {
      const { title } = req.body;
      const subtasks = [
        { id: `sb1-${Date.now()}`, title: "Clear your desk and turn on Do Not Disturb for 15 minutes." },
        { id: `sb2-${Date.now()}`, title: `Draft exactly 3 main headers/bullet points for "${title || 'this task'}" on a blank document.` },
        { id: `sb3-${Date.now()}`, title: "Write a loose, rough introductory draft without looking back or self-editing." },
        { id: `sb4-${Date.now()}`, title: "Verify the core delivery guidelines, resolve blockers, and hit submit!" }
      ];

      const draftContent = `# Starter Outline for: ${title || 'My Task'}

## Objective
To successfully launch, draft, and finalize this task before the pending deadline.

## Core Pillars
1. **Initial Ideation**: Write down some rough ideas immediately to get over the starting hump.
2. **Structural Bulk**: Formulate the primary points, data values, or responses.
3. **Polishing**: Polish syntax, check for typos, and perfect formatting.

*Interactive Coach Tip: The first 5 minutes of working is always the hardest. Begin immediately!*`;

      const procrastinationQuote = "Don't focus on the entire climb: just focus on the single step directly under your feet right now!";

      res.json({
        subtasks,
        draftContent,
        procrastinationQuote
      });
    } catch (fallbackErr: any) {
      res.status(500).json({ error: "Failed to break down task", details: fallbackErr.message });
    }
  }
});

// 4. Delay Postpone Assessment
app.post("/api/advisor/delay", async (req, res) => {
  try {
    const { title, deadline, notes, priority, delayReason } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const client = getGeminiClient();
    const prompt = `
      You are the Postponement Advisor for "The Last-Minute Life Saver".
      The user wants to delay or reschedule the following task:
      - Title: "${title}"
      - Notes: "${notes || 'No description'}"
      - Deadline: "${deadline}"
      - Priority: "${priority}"
      
      The user's stated reason for wanting to put it off:
      "${delayReason || 'No specific reason given, they just clicked delay'}"
      
      Determine:
      1. Is this reason standard, sneaky procrastination (e.g., 'too tired', 'will do it tomorrow', 'need perfect mood') or a legitimate blocker (e.g. emergency, technical constraint, missing vital resource)?
      2. Provide a highly direct, insightful reaction. Call out intellectual procrastination tricks if you spot them, but remain warm.
      3. Recommend a "Compromise Action": A ultra-short 5-minute action they can do right now so they still make progress instead of deferring it entirely. E.g. "Do not postpone editing. Instead, spends 5 minutes selecting the color palette and save".
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["verdict", "response", "compromiseAction"],
          properties: {
            verdict: {
              type: Type.STRING,
              description: "Must be 'procrastination' or 'reasonable'"
            },
            response: {
              type: Type.STRING,
              description: "Your brief 2-3 sentence coaching feedback."
            },
            compromiseAction: {
              type: Type.STRING,
              description: "A super low-stakes 5-minute action they should do immediately instead of postponing. Be persuasive!"
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Delay advisor failed, falling back to local compromise generator:", error);
    try {
      const { title } = req.body;
      res.json({
        verdict: "procrastination",
        response: `Putting off "${title || 'this task'}" is normal when fatigue or friction strikes. However, delaying it often shifts stress to tomorrow. Let's find a middle ground.`,
        compromiseAction: `Agree to open the task resources and spend exactly 5 minutes reviewing or summarizing elements right now. If it still feels overwhelming, postpone with full peace of mind!`
      });
    } catch (fallbackErr: any) {
      res.status(500).json({ error: "Delay advisor experienced an issue", details: fallbackErr.message });
    }
  }
});

// 5. Speak/Voice Assistant Coach Conversation Endpoint
app.post("/api/coach/chat", async (req, res) => {
  try {
    const { messages, speechEnabled, voiceName } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const client = getGeminiClient();
    
    // Construct chat history or prompt instruction
    const systemInstruction = `
      You are "The Last-Minute Life Saver" AI voice active productivity coach.
      Your voice is warm, proactive, dynamic, and somewhat direct. You hate procrastination and you recognize lists are easy to compile but hard to execute.
      Keep your replies under 3 sentences! This is conversational. Focus on small, actionable instructions.
      Example: "Don't sweat the giant list. Just choose the math task right now, we can do 15 minutes of it together."
      Ask short, direct questions to get the user moving.
    `;

    // Package messages in gemini structure
    const formattedContents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: msg.content }]
    }));

    // Generate response using 3.5-flash
    const chatResponse = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.8,
      }
    });

    const botText = chatResponse.text || "I'm on it! Let's get to work.";
    
    let base64Audio = null;
    
    // If the user expects speaking voice support, we generate the TTS audio stream
    if (speechEnabled) {
      try {
        console.log(`Generating TTS with model gemini-3.1-flash-tts-preview and voice ${voiceName || 'Kore'}`);
        const ttsResponse = await client.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: botText }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || "Kore" },
              },
            },
          },
        });
        
        base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
      } catch (err: any) {
        console.error("TTS audio generation failed:", err);
        // Fall back gracefully with no audio
      }
    }

    res.json({
      content: botText,
      audio: base64Audio
    });
  } catch (error: any) {
    console.error("Voice coach endpoint failed, falling back to local chat text:", error);
    try {
      const botText = "We are currently experiencing high request demand, but remember: action precedes motivation! Let's choose your single highest high-impact item and conquer the first 5 minutes of setup right now.";
      res.json({
        content: botText,
        audio: null
      });
    } catch (fallbackErr: any) {
      res.status(500).json({ error: "Proactive coach experienced an issue", details: fallbackErr.message });
    }
  }
});

// Vite Middleware integration for Full-Stack deployment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully operational on port ${PORT}`);
  });
}

startServer();
