const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// 1. Add generate_roadmap tool
const toolsCode = `
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
`;

code = code.replace(/const buildTeamTool = \{[\s\S]*?\}\s*\]\s*\};\s*const responseStream/m, toolsCode + '\n    const responseStream');

// 2. Handle generate_roadmap tool call
const handleToolCode = `
          if (call.name === "build_team") {
            const { required_skills, team_size } = call.args;
            let matchedUsers = [];
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
                    matching_skills: data.skills?.filter((s) => required_skills.includes(s)) || []
                  });
                });
              } catch (e) {
                console.error("Firestore error querying skills:", e);
              }
            }
            res.write(\`data: \${JSON.stringify({ type: 'team_roster', roster: matchedUsers })}\\n\\n\`);
          } else if (call.name === "generate_roadmap") {
            const roadmap = call.args;
            res.write(\`data: \${JSON.stringify({ type: 'roadmap', roadmap })}\\n\\n\`);
          }
`;

code = code.replace(/if \(call\.name === "build_team"\) \{[\s\S]*?res\.write\(`data: \$\{JSON\.stringify\(\{ type: 'team_roster', roster: matchedUsers \}\)\}\\n\\n`\);\s*\}/m, handleToolCode);

fs.writeFileSync('server.ts', code);
