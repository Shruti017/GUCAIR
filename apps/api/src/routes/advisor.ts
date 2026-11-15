import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import AssessmentSubmission from '../models/AssessmentSubmission';
import University from '../models/University';

const router = Router();

type AIProvider = 'gemini' | 'openai';

const providerConfig: Record<AIProvider, { baseUrl: string; keyName: string; modelName: string; defaultModel: string }> = {
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    keyName: 'GEMINI_API_KEY',
    modelName: 'GEMINI_MODEL',
    defaultModel: 'gemini-3.8-flash',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    keyName: 'OPENAI_API_KEY',
    modelName: 'OPENAI_MODEL',
    defaultModel: 'gpt-4o-mini',
  },
};

async function requestAI(provider: AIProvider, apiKey: string, model: string, messages: Array<{ role: 'system' | 'user'; content: string }>) {
  const config = providerConfig[provider];
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, temperature: 0.2, messages }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`${provider} request failed with HTTP ${response.status}`);

  const data: any = await response.json();
  const answer = data.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim()) {
    throw new Error(`${provider} returned an empty answer`);
  }
  return answer.trim();
}

router.post('/recommendations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const parsed = z.object({ question: z.string().min(3).max(2000) }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Enter a question (3–2000 characters).' });
    }

    let universityId = req.user!.university;
    if (req.user!.role === 'super_admin' && req.body.universityId) {
      universityId = String(req.body.universityId);
    }
    if (!universityId) {
      return res.status(400).json({ message: 'Your account is not linked to a university.' });
    }

    const [university, result] = await Promise.all([
      University.findById(universityId).lean(),
      AssessmentSubmission.findOne({ university: universityId, status: 'published' })
        .sort({ publishedAt: -1 })
        .lean(),
    ]);
    if (!university) return res.status(404).json({ message: 'University not found' });
    if (!result) {
      return res.status(404).json({
        message: 'No published assessment is available to ground recommendations.',
      });
    }

    const evidence = {
      university: university.name,
      country: university.country,
      overallScore: result.overallScore,
      readinessLevel: result.readinessLevel,
      dimensions: result.dimensionScores,
    };
    const preferredProvider = (process.env.AI_PROVIDER || 'gemini').trim().toLowerCase();
    if (preferredProvider !== 'gemini' && preferredProvider !== 'openai') {
      return res.status(503).json({
        message: 'AI_PROVIDER must be set to either "gemini" or "openai".',
        evidence,
      });
    }

    const providers: AIProvider[] = preferredProvider === 'gemini'
      ? ['gemini', 'openai']
      : ['openai', 'gemini'];
    const configuredProviders = providers.flatMap((provider) => {
      const config = providerConfig[provider];
      const apiKey = process.env[config.keyName]?.trim();
      if (!apiKey) return [];
      return [{
        provider,
        apiKey,
        model: process.env[config.modelName]?.trim() || config.defaultModel,
      }];
    });
    if (!configuredProviders.length) {
      return res.status(503).json({
        message: 'AI Advisor is not configured. Set GEMINI_API_KEY and/or OPENAI_API_KEY on the server.',
        evidence,
      });
    }

    const messages = [
      {
        role: 'system' as const,
        content:
          'You are GUCAIR’s evidence-grounded university AI-readiness advisor. Use only the supplied university assessment evidence. Clearly distinguish evidence from suggestions. Do not invent facts, scores, programs, partners, or resources. Give practical prioritized actions.',
      },
      {
        role: 'user' as const,
        content: `Assessment evidence (JSON): ${JSON.stringify(evidence)}\n\nQuestion: ${parsed.data.question}`,
      },
    ];
    for (const configured of configuredProviders) {
      try {
        const answer = await requestAI(configured.provider, configured.apiKey, configured.model, messages);
        return res.json({ answer, evidence, model: configured.model, provider: configured.provider });
      } catch {
        // Try the other configured provider if this request fails or times out.
      }
    }

    return res.status(502).json({
      message: 'Both configured AI providers failed to complete the request.',
      evidence,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
