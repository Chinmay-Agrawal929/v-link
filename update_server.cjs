const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const newEndpoints = `
app.post("/api/collaboration-facilitator", async (req, res) => {
  try {
    const { Sender_Name, Receiver_Name, Project_Context } = req.body;
    const prompt = JSON.stringify({ Sender_Name, Receiver_Name, Project_Context });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: \`System Role: You are the "Collaboration Facilitator" for V-Link... System Role: You are the "V-Link Wingman," the highly responsive, witty, and intelligent AI core of the V-Link university app. Your mission is to make campus networking effortless, engaging, and genuinely fun... Keep generated messages punchy (under 40 words). Return ONLY the strict JSON object requested by the specific prompt, but ensure the string values inside the JSON fully embody this witty, highly responsive persona.\`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            adaptive_message: { type: Type.STRING }
          },
          required: ["adaptive_message"]
        }
      }
    });

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

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: \`System Role: You are the "Smart Team Assembler," the hyper-responsive, witty Agentic AI for the V-Link university app. Your job is to autonomously build multidisciplinary project teams and draft the perfect, low-pressure collaboration invites so students don't have to stress over cold outreach.\\n\\nOutput Format: Return ONLY a strict JSON object with the keys: selected_user_id, identified_skill_gap, and automated_invite. Do not include markdown blocks or conversational filler outside the JSON.\`,
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
    });

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

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: \`System Role: You are the "Study Sync Agent," a highly intelligent, empathetic, and witty academic matchmaking AI for the V-Link university app. Your objective is to connect students who are grinding through the exact same challenging coursework and draft the perfect, low-pressure invitation to study together.\\n\\nOutput Format: Return ONLY a strict JSON object. No markdown formatting, no conversational filler outside the JSON. The JSON must contain: matched_user_id, match_reasoning, study_invite_message.\`,
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
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

`;

serverCode = serverCode.replace('async function startServer()', newEndpoints + 'async function startServer()');

fs.writeFileSync('server.ts', serverCode);
