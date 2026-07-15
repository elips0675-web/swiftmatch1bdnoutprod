import { useState, useEffect } from 'react'
import { useLanguage } from "@/context/language-context"
import { useRouter } from "@/shims/next-navigation"
import { getToken } from '@/lib/token'
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, EyeOff, ShieldCheck, Scale } from "lucide-react"
import { toast } from 'sonner'

export default function SettingsPrivacy() {
  const { t } = useLanguage()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [settings, setSettings] = useState({ incognito: false, dataProcessingConsent: true })

  useEffect(() => {
    setIsClient(true)
    const token = getToken()
    fetch('/api/settings', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then((data: Record<string, unknown>) => {
        setSettings({
          incognito: Boolean(data.incognito),
          dataProcessingConsent: data.dataProcessingConsent !== false,
        })
      })
      .catch(() => {})
  }, [])

  const handleIncognitoChange = async (val: boolean) => {
    setSettings(prev => ({ ...prev, incognito: val }))
    const token = getToken()
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ incognito: val }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setSettings(prev => ({ ...prev, incognito: !val }))
      toast.error(t('settings.error'))
    }
  }

  const handleConsentChange = async (val: boolean) => {
    setSettings(prev => ({ ...prev, dataProcessingConsent: val }))
    const token = getToken()
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dataProcessingConsent: val }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setSettings(prev => ({ ...prev, dataProcessingConsent: !val }))
      toast.error(t('settings.error'))
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft size={16} /> {t('common.back') || 'Назад'}
      </button>
      <h1 className="text-2xl font-black">{t('settings.privacy')}</h1>

      <div className="space-y-1">
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <EyeOff size={18} />
            </div>
            <div>
              <p className="text-sm font-bold">{t('settings.incognito')}</p>
            </div>
          </div>
          <Switch data-testid="switch-incognito" checked={isClient ? settings.incognito : false} onCheckedChange={handleIncognitoChange} />
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-bold">{t('settings.security')}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs text-primary border-primary/20">{t('settings.security.status')}</Badge>
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-bold">{t('settings.data_consent')}</p>
            </div>
          </div>
          <Switch data-testid="switch-data-consent" checked={isClient ? settings.dataProcessingConsent : true} onCheckedChange={handleConsentChange} />
        </div>
      </div>

      <div className="flex items-center justify-between py-3 border-b cursor-pointer hover:bg-muted/30 -mx-4 px-4 transition-colors rounded-lg" onClick={() => router.push('/legal/privacy')}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <Scale size={18} />
          </div>
          <p className="text-sm font-bold">{t('settings.privacy_policy')}</p>
        </div>
      </div>
    </div>
  )
}
