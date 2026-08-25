
import { useState } from 'react';
import { useRouter } from "@/shims/next-navigation";
import { getSupabase } from "@/lib/supabase";
import { ChevronLeft, Check, Chrome as Home, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { useLanguage } from '@/context/language-context';
import { 
    ATTACHMENT_STYLE_QUESTIONS, 
    calculateAttachmentStyle, 
    ATTACHMENT_STYLE_INFO,
    AttachmentStyle
} from '@/lib/attachment-styles';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function AttachmentStyleTestPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const { t } = useLanguage();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: AttachmentStyle }>({});
  const [testResult, setTestResult] = useState<AttachmentStyle | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAnswer = (questionId: string, style: AttachmentStyle) => {
    const newAnswers = { ...answers, [questionId]: style };
    setAnswers(newAnswers);

    setTimeout(() => {
        if (currentQuestionIndex < ATTACHMENT_STYLE_QUESTIONS.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            const result = calculateAttachmentStyle(newAnswers);
            setTestResult(result);
            saveResult(result);
        }
    }, 300); // Small delay for visual feedback
  };

  const saveResult = async (result: AttachmentStyle) => {
    setIsSaving(true);
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        try {
            const profile = JSON.parse(savedProfile);
            const updatedProfile = { ...profile, attachmentStyle: result };
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        } catch (e) { /* ignored */ }
    }

    if (!supabase) {
        setIsSaving(false);
        toast({ title: t('attach.toast.done'), description: `${t('attach.toast.your_style')} ${t(ATTACHMENT_STYLE_INFO[result].labelKey)}` });
        return;
    };
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          await supabase
            .from('profiles')
            .update({ attachment_style: result })
            .eq('id', authUser.id)
        }
        toast({ title: t('attach.toast.saved'), description: `${t('attach.toast.your_style')} ${t(ATTACHMENT_STYLE_INFO[result].labelKey)}` });
    } catch (error) {
        if (import.meta.env.DEV) console.error("Error saving attachment style:", error);
        toast({ title: t('attach.toast.save_error'), variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }

  const resetTest = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTestResult(null);
  };

  const currentQuestion = ATTACHMENT_STYLE_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / ATTACHMENT_STYLE_QUESTIONS.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fb]">
      <AppHeader />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
          <AnimatePresence mode="wait">
          {testResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center"
              >
                  <div className="bg-white rounded-3xl p-8 app-shadow border border-border/40 max-w-md mx-auto">
                    <div className="text-8xl mx-auto mb-6 w-28 h-28 rounded-full flex items-center justify-center bg-muted">
                        {ATTACHMENT_STYLE_INFO[testResult].emoji}
                    </div>
                    <h2 className="text-3xl font-black font-headline tracking-tighter text-purple-700">
                        {t(ATTACHMENT_STYLE_INFO[testResult].labelKey)}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-4 mb-8 leading-relaxed">
                        {t(ATTACHMENT_STYLE_INFO[testResult].descKey)}
                    </p>
                    
                    <div className="space-y-4">
                        <Button 
                            onClick={() => router.push('/profile')} 
                            className="w-full h-14 rounded-2xl gradient-bg text-white font-black uppercase tracking-widest shadow-xl shadow-primary/30 border-0 hover:brightness-110 active:scale-95 transition-all"
                        >
                            <Home className="mr-2" size={16}/>
                            {t('attach.to_profile')}
                        </Button>
                        <Button onClick={resetTest} variant="ghost" className="w-full h-12 rounded-xl">
                            <Repeat className="mr-2" size={14}/>
                            {t('attach.retake')}
                        </Button>
                    </div>
                  </div>
              </motion.div>
          ) : (
              <motion.div
                key="question"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="max-w-md mx-auto"
              >
                <div className="text-center mb-6">
                    <h1 className="text-xl font-black font-headline tracking-tight">{t('attach.test.title')}</h1>
                    <p className="text-muted-foreground text-xs mt-1">{t('attach.test.subtitle')}</p>
                </div>

                <div className="bg-white rounded-3xl p-6 app-shadow space-y-6 border border-border/40">
                    <div className="space-y-3">
                        <div className="w-full bg-muted rounded-full h-2.5">
                            <motion.div 
                                className="bg-primary h-2.5 rounded-full" 
                                style={{ width: `${progress}%` }}
                                initial={{ width: `${((currentQuestionIndex) / ATTACHMENT_STYLE_QUESTIONS.length) * 100}%` }}
                                animate={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="text-center text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                            {t('attach.question_of', { current: currentQuestionIndex + 1, total: ATTACHMENT_STYLE_QUESTIONS.length })}
                        </div>
                    </div>
                    
                    <div className="text-center pt-2">
                        <h3 className="font-semibold text-lg leading-snug min-h-[50px]">{t(currentQuestion.text)}</h3>
                    </div>

                    <div className="space-y-3 pt-2">
                        {currentQuestion.options.map(option => (
                            <motion.button
                                key={option.id} 
                                onClick={() => handleAnswer(currentQuestion.id, option.style)} 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl border-2 transition-all font-semibold bg-muted/30 flex items-center justify-between",
                                    answers[currentQuestion.id] === option.style 
                                        ? 'border-primary bg-primary/5' 
                                        : 'border-transparent hover:border-primary/50'
                                )}
                            >
                                <span>{t(option.text)}</span>
                                {answers[currentQuestion.id] === option.style && <Check size={20} className="text-primary" />}
                            </motion.button>
                        ))}
                    </div>
                </div>
                 <Button onClick={() => router.back()} variant="ghost" className="w-full mt-4 text-muted-foreground">
                    <ChevronLeft size={16} className="mr-1" />
                    {t('attach.back')}
                </Button>
              </motion.div>
          )}
          </AnimatePresence>
      </main>
    </div>
  );
}
