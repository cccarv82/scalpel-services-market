import type { ScalpelPluginContext } from '@scalpelpoe/plugin-sdk'
import { persistSettings, useStore } from '../store'
import { card, label as labelStyle } from './ui'

interface Props {
  ctx: ScalpelPluginContext
}

export function SettingsPanel({ ctx }: Props) {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)

  const update = async (patch: Partial<typeof settings>) => {
    setSettings(patch)
    await persistSettings(ctx.storage, { ...settings, ...patch })
  }

  return (
    <div style={{ padding: 12, maxWidth: 520 }}>
      <div style={card}>
        <div style={labelStyle}>Notifications</div>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 0' }}>
          <span>Beep on new incoming request</span>
          <input
            type="checkbox"
            checked={settings.beepOnNewRequest}
            onChange={(e) => update({ beepOnNewRequest: e.target.checked })}
          />
        </label>
        <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>
          Polls the server every {Math.round(settings.pollIntervalMs / 1000)}s. Overlay window pops up when an event arrives.
          Position it once in the top-right corner — Scalpel remembers it.
        </div>
      </div>
    </div>
  )
}
