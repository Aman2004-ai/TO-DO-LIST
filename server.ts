import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const ROLE_SYSTEM_INSTRUCTIONS: Record<string, { instruction: string; defaultModel: string; label: string }> = {
  general: {
    label: 'General Assistant',
    defaultModel: 'gemini-3.5-flash',
    instruction:
      'You are TaskVault’s friendly and proactive productivity assistant. You help users manage their personal and collaborative to-do lists, prioritize tasks, suggest smart schedules, and break large goals into small, manageable items. Keep answers clear, structured, and motivational.',
  },
  fast: {
    label: 'Fast Organizer',
    defaultModel: 'gemini-3.1-flash-lite',
    instruction:
      'You are a high-speed task categorizer and organizer. Respond with rapid, concise bullet points, direct classifications (Priority, Category, Estimated Time), and minimal filler words. Focus purely on immediate speed and utility.',
  },
  complex: {
    label: 'Deep Project Planner',
    defaultModel: 'gemini-3.1-pro-preview',
    instruction:
      'You are a senior strategic advisor and project architect. When analyzing complex tasks and multi-phase goals, provide comprehensive deep-dive planning: identify critical path dependencies, risk assessments, phased execution timelines, and rigorous priority matrices.',
  },
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Multi-turn Gemini Chat endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        messages,
        role = 'general',
        modelOverride,
        taskContext,
        customInstruction,
      } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      const roleConfig = ROLE_SYSTEM_INSTRUCTIONS[role] || ROLE_SYSTEM_INSTRUCTIONS.general;

      // Model resolution rule:
      // complex -> gemini-3.1-pro-preview
      // fast -> gemini-3.1-flash-lite
      // general -> gemini-3.5-flash
      const selectedModel = modelOverride || roleConfig.defaultModel;

      let baseInstruction = customInstruction || roleConfig.instruction;

      if (taskContext && Array.isArray(taskContext) && taskContext.length > 0) {
        const taskSummary = taskContext
          .map(
            (t: any, idx: number) =>
              `${idx + 1}. [${t.completed ? 'DONE' : 'PENDING'}] "${t.title}" (Priority: ${t.priority || 'medium'}, Category: ${t.category || 'General'}${t.dueDate ? `, Due: ${t.dueDate}` : ''})`
          )
          .join('\n');

        baseInstruction += `\n\n--- Current User Tasks in TaskVault ---\n${taskSummary}\n\nYou can reference these current tasks to help the user prioritize, reflect on progress, or suggest next steps.`;
      }

      // Format multi-turn message history for @google/genai SDK
      const contents = messages.map((m: { role: 'user' | 'model'; content: string }) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const ai = getGenAI();

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: baseInstruction,
        },
      });

      const replyText = response.text || 'I could not generate a response at this moment.';

      return res.json({
        reply: replyText,
        modelUsed: selectedModel,
        role,
      });
    } catch (error: any) {
      console.error('Gemini chat error:', error);
      return res.status(500).json({
        error: error.message || 'Internal server error while processing chat request',
      });
    }
  });

  // Vite middleware in dev; Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskVault server running at http://localhost:${PORT}`);
  });
}

startServer();
