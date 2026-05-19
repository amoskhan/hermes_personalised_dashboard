import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json([
    { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'DeepSeek', costPer1kTokens: 0.0002 },
    { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic (OpenRouter)', costPer1kTokens: 0.003 },
    { id: 'anthropic/claude-haiku-4', name: 'Claude Haiku 4', provider: 'Anthropic (OpenRouter)', costPer1kTokens: 0.0008 },
    { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic (OpenRouter)', costPer1kTokens: 0.015 },
    { id: 'openai/gpt-oss-120b:free', name: 'GPT OSS 120B', provider: 'OpenRouter', costPer1kTokens: 0 },
    { id: 'arcee-ai/trinity-large-thinking:free', name: 'Trinity Large Thinking', provider: 'OpenRouter', costPer1kTokens: 0 },
    { id: 'openrouter/owl-alpha', name: 'Owl Alpha', provider: 'OpenRouter', costPer1kTokens: 0 },
  ])
}
