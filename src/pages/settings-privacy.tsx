import { useState, useEffect } from 'react'
import { useLanguage } from "@/context/language-context"
import { useRouter } from "@/shims/next-navigation"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, EyeOff, Globe, ShieldCheck, Scale, Download, Trash2 } from "lucide-react"
import { toast } from 'sonner'

export default function SettingsPrivacy() {
  const { t } = useLanguage()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [settings, setSettings] = useState({ incognito: false, passport_mode: false, passport_city: '', dataProcessingConsent: true })

  useEffect(() => {
    setIsClient(true)
    fetch('/api/settings/privacy')
      .then(r => r.json())
      .then(data => {
        setSettings(prev => ({
          ...prev,
          incognito: Boolean(data.incognito),
          passport_mode: Boolean(data.passport_mode),
          passport_city: data.passport_city || '',
        }))
        localStorage.setItem('incognito-mode', JSON.stringify(Boolean(data.incognito)))
      })
      .catch(() => {
        setSettings({
          incognito: JSON.parse(localStorage.getItem('incognito-mode') || 'false'),
          passport_mode: false,
          passport_city: '',
          dataProcessingConsent: JSON.parse(localStorage.getItem('data-processing-consent') || 'true'),
        })
      })
    setSettings(prev => ({
      ...prev,
      dataProcessingConsent: JSON.parse(localStorage.getItem('data-processing-consent') || 'true'),
    }))
  }, [])

  const savePrivacy = (body: Record<string, unknown>) => {
    fetch('/api/settings/privacy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {})
  }

  const handleIncognitoChange = (val: boolean) => {
    setSettings(prev => ({ ...prev, incognito: val }))
    localStorage.setItem('incognito-mode', JSON.stringify(val))
    savePrivacy({ incognito: val })
    toast.success(val ? t('settings.incognito.enabled_desc') : t('settings.incognito.disabled_desc'))
  }

  const handlePassportModeChange = (val: boolean) => {
    setSettings(prev => ({ ...prev, passport_mode: val }))
    savePrivacy({ passport_mode: val, passport_city: val ? settings.passport_city : null })
    toast.success(val ? t('settings.passport_mode.enabled_desc') : t('settings.passport_mode.disabled_desc'))
  }

  const handlePassportCityChange = (city: string) => {
    setSettings(prev => ({ ...prev, passport_city: city }))
  }

  const handlePassportCityBlur = () => {
    if (settings.passport_mode && settings.passport_city) {
      savePrivacy({ passport_city: settings.passport_city })
    }
  }

  const handleExportData = () => {
    fetch('/api/data/export')
      .then(r => r.json())
      .then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `swiftmatch-data-${Date.now()}.json`; a.click()
        URL.revokeObjectURL(url)
        toast.success(t('settings.data_export.success'))
      })
      .catch(() => toast.error('Export failed'))
  }

  const handleEraseData = () => {
    if (!window.confirm(t('settings.data_erase.confirm'))) return
    fetch('/api/data/erase/request', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.token) navigator.clipboard?.writeText(data.token)
        toast.success(t('settings.data_erase.token_sent'))
      })
      .catch(() => toast.error('Erase request failed'))
  }

  const handleConsentChange = (val: boolean) => {
    setSettings(prev => ({ ...prev, dataProcessingConsent: val }))
    localStorage.setItem('data-processing-consent', JSON.stringify(val))
    toast.success(val ? t('settings.consent_enabled') : t('settings.consent_withdrawn'))
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
              <Globe size={18} />
            </div>
            <div>
              <p className="text-sm font-bold">{t('settings.passport_mode')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.passport_mode.desc')}</p>
            </div>
          </div>
          <Switch data-testid="switch-passport-mode" checked={isClient ? settings.passport_mode : false} onCheckedChange={handlePassportModeChange} />
        </div>

        {settings.passport_mode && (
          <div className="pl-12 pb-3">
            <Input
              placeholder="City name"
              value={settings.passport_city}
              onChange={e => handlePassportCityChange(e.target.value)}
              onBlur={handlePassportCityBlur}
              data-testid="passport-city"
            />
          </div>
        )}

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

      <h2 className="text-lg font-black pt-4">{t('settings.gdpr')}</h2>

      <div className="flex items-center justify-between py-3 border-b cursor-pointer hover:bg-muted/30 -mx-4 px-4 transition-colors rounded-lg" onClick={handleExportData}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Download size={18} />
          </div>
          <div>
            <p className="text-sm font-bold">{t('settings.data_export')}</p>
            <p className="text-xs text-muted-foreground">{t('settings.data_export.desc')}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between py-3 border-b cursor-pointer hover:bg-muted/30 -mx-4 px-4 transition-colors rounded-lg" onClick={handleEraseData}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <Trash2 size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-destructive">{t('settings.data_erase')}</p>
            <p className="text-xs text-muted-foreground">{t('settings.data_erase.desc')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
