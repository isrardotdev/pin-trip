import axios from 'axios'
import { config } from '../config'

const COLORS = { error: 0xc0392b, warn: 0xc4862a }

export function notifyDiscord(
  title: string,
  details: string,
  level: 'error' | 'warn' = 'error',
): void {
  if (!config.discordWebhookUrl) return

  const emoji = level === 'error' ? '🚨' : '⚠️'

  axios
    .post(config.discordWebhookUrl, {
      embeds: [
        {
          title: `${emoji} WanderPin — ${title}`,
          description: `\`\`\`\n${details}\n\`\`\``,
          color: COLORS[level],
          timestamp: new Date().toISOString(),
          footer: { text: `ENV: ${config.nodeEnv}` },
        },
      ],
    })
    .catch(() => {
      // Never let a failed Discord notification crash or block the app
    })
}
