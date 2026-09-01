import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import nodemailer from "nodemailer";
import { initializeApp as initClientApp } from "firebase/app";
import { initializeFirestore as getClientFirestore, collection, getDocs, limit, query, doc, getDoc, where } from "firebase/firestore";
import fsSync from "fs";
import path from "path";
let firebaseConfig = {};
try {
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  firebaseConfig = JSON.parse(fsSync.readFileSync(configPath, "utf8"));
} catch (e) {}
const clientApp = initClientApp(firebaseConfig);
const db = getClientFirestore(clientApp, { experimentalForceLongPolling: true }, (firebaseConfig as any).firestoreDatabaseId || '(default)');


const otpStore = new Map<string, any>();


async function callAIWithRetry(callFn: () => Promise<any>, maxRetries = 3): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await callFn();
    } catch (err: any) {
      if (err.status === 503 || err.status === 429 || (err.message && err.message.includes('503'))) {
        attempt++;
        if (attempt >= maxRetries) throw err;
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(`AI call failed with ${err.status || 503}. Retrying in ${Math.round(delay)}ms...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
}

const app = express();
const PORT = 3000;

app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


const originalGenerateContentStream = ai.models.generateContentStream.bind(ai.models);
ai.models.generateContentStream = async function(args: any) {
  let attempt = 0;
  const maxRetries = 3;
  while (attempt < maxRetries) {
    try {
      return await originalGenerateContentStream(args);
    } catch (err: any) {
      if (err.status === 503 || err.status === 429 || (err.message && err.message.includes('503'))) {
        attempt++;
        if (attempt >= maxRetries) throw err;
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(`AI Stream call failed with ${err.status || 503}. Retrying in ${Math.round(delay)}ms...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
  return await originalGenerateContentStream(args);
} as any;

const originalGenerateContent = ai.models.generateContent.bind(ai.models);
ai.models.generateContent = async function(args: any) {
  let attempt = 0;
  const maxRetries = 3;
  while (attempt < maxRetries) {
    try {
      return await originalGenerateContent(args);
    } catch (err: any) {
      if (err.status === 503 || err.status === 429 || (err.message && err.message.includes('503'))) {
        attempt++;
        if (attempt >= maxRetries) throw err;
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(`AI call failed with ${err.status || 503}. Retrying in ${Math.round(delay)}ms...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
  return await originalGenerateContent(args);
};



const VLINK_ORACLE_PROMPT = `You are the 'V-Link Oracle', an omniscient, incredibly cute, and highly intelligent personal tutor and campus researcher for VIT Chennai students. You explain difficult engineering topics step-by-step, debug code instantly, and research live information across the campus while keeping a warm, playful, and slightly cheeky personality. Keep answers concise, highly formatted (Markdown), and end with a playful check-in.`;

app.post("/api/chat", async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Transfer-Encoding', 'chunked');

  try {
    const { message, imageBase64, history } = req.body;
    let contextData = "Real-time Campus Context:\n";
    
    try {
      
      const eventsSnap = await getDocs(query(collection(db, "vit_events"), limit(3)));
      eventsSnap.forEach((doc: any) => {
        const d = doc.data();
        contextData += `- EVENT: ${d.title} (Date: ${d.date}) by ${d.organizer}\n`;
      });
      const usersSnap = await getDocs(query(collection(db, "users"), limit(3)));
      usersSnap.forEach((doc: any) => {
        const d = doc.data();
        contextData += `- USER: ${d.name} (${d.branch}) Skills: ${d.skills?.join(', ')}\n`;
      });
    } catch (e) {
      contextData += "Unable to fetch campus data.\n";
    }

    const contents = (history || []).map((msg: any) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: msg.text }]
    }));

    const userParts: any[] = [{ text: `[System RAG Context: ${contextData}]\n\nUser Message: ${message}` }];

    if (imageBase64) {
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      const mimeType = imageBase64.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
      userParts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    contents.push({ role: 'user', parts: userParts });

    
    const buildTeamTool = {
      functionDeclarations: [
        {
          name: "build_team",
          description: "Analyzes the user's project idea, extracts the required skills, and searches the campus network for the best matching students to form a team.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              project_description: { type: Type.STRING },
              team_size: { type: Type.INTEGER },
              required_skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["project_description", "team_size", "required_skills"]
          }
        },
        {
          name: "generate_roadmap",
          description: "Generates a structured 4-week development roadmap breaking down the project into technical milestones.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              project_goal: { type: Type.STRING },
              team_roles: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    week: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    tasks: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          role: { type: Type.STRING },
                          task: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: ["project_goal", "team_roles", "milestones"]
          }
        }
      ]
    };

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction: VLINK_ORACLE_PROMPT,
        temperature: 0.7,
        tools: [buildTeamTool]
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.functionCalls && chunk.functionCalls.length > 0) {
        for (const call of chunk.functionCalls) {
          
          if (call.name === "build_team") {
            const args = call.args as any;
            const required_skills: string[] = args.required_skills;
            const team_size: number = args.team_size;
            let matchedUsers: any[] = [];
            if (required_skills && required_skills.length > 0) {
              try {
                const usersSnap = await getDocs(query(
                  collection(db, "users"),
                  where("skills", "array-contains-any", required_skills),
                  limit(team_size || 5)
                ));
                usersSnap.forEach(doc => {
                  const data = doc.data();
                  matchedUsers.push({
                    uid: doc.id,
                    name: data.name,
                    branch: data.branch,
                    skills: data.skills,
                    matching_skills: data.skills?.filter((s: string) => required_skills.includes(s)) || []
                  });
                });
              } catch (e) {
                console.error("Firestore error querying skills:", e);
              }
            }
            res.write(`data: ${JSON.stringify({ type: 'team_roster', roster: matchedUsers })}\n\n`);
          } else if (call.name === "generate_roadmap") {
            const roadmap = call.args;
            res.write(`data: ${JSON.stringify({ type: 'roadmap', roadmap })}\n\n`);
          }

        }
      } else if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

app.get("/api/curate-events", async (req, res) => {
  try {
    const uid = req.query.uid as string;
    if (!uid) return res.status(400).json({ error: "Missing uid" });

    
    const userSnap = await getDoc(doc(db, "users", uid));
    const userProfile = userSnap.exists ? userSnap.data() : { skills: ["React", "JavaScript"], branch: "CSE" };

    const eventsSnap = await getDocs(query(collection(db, "vit_events"), limit(10)));
    const globalResources = [];
    eventsSnap.forEach((doc) => {
      globalResources.push({ id: doc.id, ...doc.data() });
    });

    if (globalResources.length === 0) {
      return res.json([]);
    }

    const prompt = `
User_Profile: ${JSON.stringify(userProfile)}
Global_Resources: ${JSON.stringify(globalResources)}
`;

    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: `System Role: You are the 'Curated Opportunity Engine,' the hyper-intelligent, witty Agentic AI for the V-Link university app. Your mission is to actively guide a student's academic and career trajectory by filtering campus noise and serving up high-value resources.\n\nTask: You will receive a JSON payload containing:\nUser_Profile: The student's current skills, academic year, and ultimate goals.\nGlobal_Resources: A list of various upcoming campus events, hackathons, and coding challenges.\n\nAction Guidelines:\nAnalyze & Filter: Evaluate the User_Profile against the Global_Resources. Select the top 2 resources that will specifically help this user achieve their stated goals or improve their tech stack.\nGenerate the 'Wingman Pitch': For each selected resource, write a punchy, highly personalized feed caption (under 35 words).\nTone: Use your signature engineering college humor. Connect the resource directly to their goals using casual, motivational language. If they want high grades, joke about boosting their CGPA. If they are prepping for placements, mention surviving technical interviews.\n\nOutput Format: Return ONLY a strict JSON array containing two objects. Each object must have: resource_id, resource_name, url, and wingman_caption. Do not include markdown blocks or any conversational filler outside the JSON array.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              resource_id: { type: Type.STRING },
              resource_name: { type: Type.STRING },
              wingman_caption: { type: Type.STRING },
              url: { type: Type.STRING }
            },
            required: ["resource_id", "resource_name", "wingman_caption", "url"]
          }
        }
      }
    }));

    const curated = JSON.parse(response.text || "[]");
    res.json(curated);
  } catch (err) {
    console.error("Curate Error:", err);
    res.status(500).json({ error: err.message });
  }
});



app.post("/api/collaboration-facilitator", async (req, res) => {
  try {
    const { Sender_Name, Receiver_Name, Project_Context } = req.body;
    const prompt = JSON.stringify({ Sender_Name, Receiver_Name, Project_Context });

    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: `System Role: You are the "Collaboration Facilitator" for V-Link... System Role: You are the "V-Link Wingman," the highly responsive, witty, and intelligent AI core of the V-Link university app. Your mission is to make campus networking effortless, engaging, and genuinely fun... Keep generated messages punchy (under 40 words). Return ONLY the strict JSON object requested by the specific prompt, but ensure the string values inside the JSON fully embody this witty, highly responsive persona.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            adaptive_message: { type: Type.STRING }
          },
          required: ["adaptive_message"]
        }
      }
    }));

    res.json(JSON.parse(response.text || "{}"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/smart-team-assembler", async (req, res) => {
  try {
    const { Project_Goal, Initiator_Profile, Candidate_Database } = req.body;
    const prompt = JSON.stringify({ Project_Goal, Initiator_Profile, Candidate_Database });

    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: `System Role: You are the "Smart Team Assembler," the hyper-responsive, witty Agentic AI for the V-Link university app. Your job is to autonomously build multidisciplinary project teams and draft the perfect, low-pressure collaboration invites so students don't have to stress over cold outreach.\n\nOutput Format: Return ONLY a strict JSON object with the keys: selected_user_id, identified_skill_gap, and automated_invite. Do not include markdown blocks or conversational filler outside the JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selected_user_id: { type: Type.STRING },
            identified_skill_gap: { type: Type.STRING },
            automated_invite: { type: Type.STRING }
          },
          required: ["selected_user_id", "identified_skill_gap", "automated_invite"]
        }
      }
    }));

    res.json(JSON.parse(response.text || "{}"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/study-sync-agent", async (req, res) => {
  try {
    const { Academic_Cry_For_Help, Peer_Database } = req.body;
    const prompt = JSON.stringify({ Academic_Cry_For_Help, Peer_Database });

    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: `System Role: You are the "Study Sync Agent," a highly intelligent, empathetic, and witty academic matchmaking AI for the V-Link university app. Your objective is to connect students who are grinding through the exact same challenging coursework and draft the perfect, low-pressure invitation to study together.\n\nOutput Format: Return ONLY a strict JSON object. No markdown formatting, no conversational filler outside the JSON. The JSON must contain: matched_user_id, match_reasoning, study_invite_message.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matched_user_id: { type: Type.STRING },
            match_reasoning: { type: Type.STRING },
            study_invite_message: { type: Type.STRING }
          },
          required: ["matched_user_id", "match_reasoning", "study_invite_message"]
        }
      }
    }));

    res.json(JSON.parse(response.text || "{}"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'test@ethereal.email',
    pass: process.env.SMTP_PASS || 'testpass'
  }
});




app.post("/api/notify", async (req, res) => {
  try {
    const { targetUid, title, body, data } = req.body;
    
    // In a real production app, we would fetch the user's FCM token from Firestore.
    // Since this is a preview/BFF, we will mock the push notification trigger.
    const userDoc = await getDoc(doc(db, 'users', targetUid));
    if (userDoc.exists()) {
      const fcmToken = userDoc.data().fcmToken;
      if (fcmToken) {
        // Example execution:
        // await admin.messaging().send({
        //   token: fcmToken,
        //   notification: { title, body },
        //   data
        // });
        console.log(`[FCM] Push Notification sent to ${targetUid}: ${title}`);
      } else {
        console.log(`[FCM] Target user ${targetUid} has no FCM token.`);
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("FCM Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!email.endsWith("@vitstudent.ac.in") && !email.endsWith("@vit.ac.in")) {
      return res.status(400).json({ error: "Only VIT emails are allowed." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;

    otpStore.set(email, { code, expiry });

    let sent = false;
    try {
      await transporter.sendMail({
        from: '"v-link Admin" <admin@vit.ac.in>',
        to: email,
        subject: 'Your v-link verification code',
        html: `<p>Your v-link verification code is: <strong>${code}</strong>. This code expires in 5 minutes.</p>`
      });
      console.log("OTP sent via nodemailer to", email);
      sent = true;
    } catch (e) {
      console.warn("Nodemailer failed. Check SMTP config.", e.message);
      console.log("Mock OTP Code is:", code);
    }
    
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;
    
    const stored = otpStore.get(email);
    
    if (!stored) {
      return res.status(400).json({ error: "No OTP requested for this email" });
    }
    
    if (Date.now() > stored.expiry) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP has expired" });
    }
    
    if (stored.code !== code) {
      return res.status(400).json({ error: "Invalid OTP code. Please fill the correct OTP." });
    }
    
    otpStore.delete(email);
    res.json({ success: true });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ error: err.message });
  }
});



async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("BFF Server running on http://localhost:" + PORT);
  });
}

startServer();
