import { useState } from "react";
import { useRouter, useSearchParams } from "@/shims/next-navigation";
import { Lock, Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import Link from "@/shims/next-link";
import { useLanguage } from "@/context/language-context";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ variant: 'destructive', title: t('auth.passwords_mismatch') })
      return
    }
    if (password.length < 6) {
      toast({ variant: 'destructive', title: t('auth.password_too_short') })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (res.ok) {
        setDone(true)
        toast({ title: t('auth.password_reset_done') })
      } else {
        const data = await res.json()
        toast({ variant: 'destructive', title: data.message || t('common.error') })
      }
    } catch {
      toast({ variant: 'destructive', title: t('common.error') })
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="font-bold text-destructive">{t('auth.invalid_reset_link')}</p>
          <Link href="/login" className="text-sm text-primary mt-2 inline-block">{t('auth.back_to_login')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            {done ? <Check className="text-white" size={28} /> : <Sparkles className="text-white" size={28} />}
          </div>
          <h1 className="text-2xl font-black tracking-tight">{t('auth.reset_title')}</h1>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <p className="font-bold text-green-700">{t('auth.password_reset_success')}</p>
            <Button onClick={() => router.push('/login')} className="w-full h-12 rounded-full gradient-bg text-white font-black uppercase tracking-wider">
              {t('auth.back_to_login')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('auth.new_password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="pl-10 h-12 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('auth.confirm_password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required minLength={6} className="pl-10 h-12 rounded-xl" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-full gradient-bg text-white font-black uppercase tracking-wider shadow-lg shadow-primary/20">
              {loading ? <Loader2 className="animate-spin" size={16} /> : t('auth.reset_button')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
