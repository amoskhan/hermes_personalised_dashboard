import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Known models Amos uses
  res.json([
    { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'DeepSeek', costPer1kTokens: 0.0002 },
    { id: 'openai/gpt-oss-120b:free', name: 'GPT OSS 120B', provider: 'OpenRouter', costPer1kTokens: 0 },
    { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic (OpenRouter)', costPer1kTokens: 0.003 },
    { id: 'anthropic/claude-haiku-4', name: 'Claude Haiku 4', provider: 'Anthropic (OpenRouter)', costPer1kTokens: 0.0008 },
    { id: 'inclusionai/ring-2.6-1t:free', name: 'Ring 2.6 1T', provider: 'OpenRouter', costPer1kTokens: 0 },
  ])
}
