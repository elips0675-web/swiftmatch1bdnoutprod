import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useLanguage } from '@/context/language-context'
import { getToken } from '@/lib/token'
import { toast } from 'sonner'
import { Loader2, Building2, ArrowLeft } from 'lucide-react'

export default function PartnerRegister() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [type, setType] = useState('deeplink')
  const [description, setDescription] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    const trimmed = name.trim()
    if (trimmed.length < 2) { toast.error(t('partner.register_name_short')); return }
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch('/api/partner/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: trimmed, type, description, contact_email: contactEmail, contact_phone: contactPhone }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message || t('partner.register_error')); return }
      toast.success(t('partner.register_success'))
      navigate('/partner/dashboard', { replace: true })
    } catch {
      toast.error(t('partner.register_error'))
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-[#F0F8FF] dark:from-[#1a1025] dark:via-[#0f0f1a] dark:to-[#0a1628] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Building2 size={24} className="text-primary" />
          </div>
          <CardTitle className="text-xl font-headline">{t('partner.register_title')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('partner.register_desc')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">{t('partner.register_name')}</label>
            <Input data-testid="partner-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('partner.register_name_placeholder')} maxLength={100} />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">{t('partner.register_type')}</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="deeplink">{t('partner.type_deeplink')}</SelectItem>
                <SelectItem value="api">{t('partner.type_api')}</SelectItem>
                <SelectItem value="saas">{t('partner.type_saas')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">{t('partner.register_description')}</label>
            <Textarea data-testid="partner-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('partner.register_description_placeholder')} rows={3} maxLength={500} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">{t('partner.register_email')}</label>
              <Input data-testid="partner-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="info@company.com" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">{t('partner.register_phone')}</label>
              <Input data-testid="partner-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+7 900 123-45-67" />
            </div>
          </div>
          <Button data-testid="submit-partner-register" className="w-full" onClick={handleRegister} disabled={loading || name.trim().length < 2}>
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {t('partner.register_button')}
          </Button>
          <Button variant="ghost" className="w-full text-xs" onClick={() => navigate('/')}>
            <ArrowLeft size={14} className="mr-1" />{t('partner.register_back')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
