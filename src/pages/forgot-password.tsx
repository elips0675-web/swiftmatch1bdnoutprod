import { useState } from "react";
import { useRouter } from "@/shims/next-navigation";
import { Mail, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import Link from "@/shims/next-link";
import { useLanguage } from "@/context/language-context";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setSent(true)
      toast({ title: data.message })
    } catch {
      toast({ variant: 'destructive', title: t('common.error') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Sparkles className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">{t('auth.forgot_title')}</h1>
          <p className="text-sm text-muted-foreground mt-2">{t('auth.forgot_desc')}</p>
        </div>

        {sent ? (
          <div className="text-center p-6 rounded-2xl bg-green-50 border border-green-200">
            <p className="font-bold text-green-700">{t('auth.forgot_sent')}</p>
            <p className="text-sm text-green-600 mt-1">{t('auth.forgot_sent_desc')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input data-testid="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mail@example.com" required className="pl-10 h-12 rounded-xl" />
              </div>
            </div>
            <Button data-testid="submit-forgot-password" type="submit" disabled={loading} className="w-full h-12 rounded-full gradient-bg text-white font-black uppercase tracking-wider shadow-lg shadow-primary/20">
              {loading ? <Loader2 className="animate-spin" size={16} /> : t('auth.send_reset')}
            </Button>
          </form>
        )}

        <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> {t('auth.back_to_login')}
        </Link>
      </div>
    </div>
  );
}
