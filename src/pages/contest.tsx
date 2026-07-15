
import { useState, useEffect, useMemo } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { useLanguage } from "@/context/language-context";
import { Trophy, Timer, Info, Crown, Maximize2, X, Award, CircleCheck as CheckCircle2, History, Medal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "@/shims/next-image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const FEMALE_ENTRIES = [
  { id: 'f1', userId: 'u1', userName: 'Алина', photo: PlaceHolderImages[6].imageUrl, votes: 1240, rank: 1, gender: 'female' },
  { id: 'f2', userId: 'u5', userName: 'Анна', photo: PlaceHolderImages[0].imageUrl, votes: 980, rank: 2, gender: 'female' },
  { id: 'f3', userId: 'u3', userName: 'Елена', photo: PlaceHolderImages[2].imageUrl, votes: 850, rank: 3, gender: 'female' },
];

const MALE_ENTRIES = [
  { id: 'm1', userId: 'u2', userName: 'Максим', photo: PlaceHolderImages[1].imageUrl, votes: 1100, rank: 1, gender: 'male' },
  { id: 'm2', userId: 'u8', userName: 'Иван', photo: PlaceHolderImages[7].imageUrl, votes: 950, rank: 2, gender: 'male' },
  { id: 'm3', userId: 'u4', userName: 'Дмитрий', photo: PlaceHolderImages[3].imageUrl, votes: 700, rank: 3, gender: 'male' },
];

const PAST_FEMALE_WINNERS = [
  { id: 'pfw1', name: 'Мария', photo: PlaceHolderImages[6].imageUrl, month: 'Апрель' },
  { id: 'pfw2', name: 'Елена', photo: PlaceHolderImages[2].imageUrl, month: 'Март' },
  { id: 'pfw3', name: 'Ксения', photo: PlaceHolderImages[8].imageUrl, month: 'Февраль' },
];

const PAST_MALE_WINNERS = [
  { id: 'pmw1', name: 'Александр', photo: PlaceHolderImages[1].imageUrl, month: 'Апрель' },
  { id: 'pmw2', name: 'Дмитрий', photo: PlaceHolderImages[3].imageUrl, month: 'Март' },
  { id: 'pmw3', name: 'Артем', photo: PlaceHolderImages[5].imageUrl, month: 'Февраль' },
];

export default function ContestPage() {
  const { t, language } = useLanguage();
  const [timeLeft, setTimeLeft] = useState("");
  const [viewerPhoto, setViewerPhoto] = useState<string | null>(null);
  const [activeGender, setActiveGender] = useState<string>("female");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const diff = endOfMonth.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      setTimeLeft(t('contest.days_left', { count: days }));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 3600000);
    return () => clearInterval(interval);
  }, [language, t]);

  const currentEntries = useMemo(() => {
    return activeGender === "female" ? FEMALE_ENTRIES : MALE_ENTRIES;
  }, [activeGender]);

  const pastWinners = useMemo(() => {
    return activeGender === "female" ? PAST_FEMALE_WINNERS : PAST_MALE_WINNERS;
  }, [activeGender]);

  const topThree = currentEntries.slice(0, 3);

  const prizes = [
    { id: 'p1', icon: <Award className="text-blue-500" />, title: t('contest.prizes.pro.title'), desc: t('contest.prizes.pro.desc') },
    { id: 'p2', icon: <Crown className="text-amber-500" />, title: t('contest.prizes.boost.title'), desc: t('contest.prizes.boost.desc') },
    { id: 'p3', icon: <Medal className="text-purple-500" />, title: t('contest.prizes.badge.title'), desc: t('contest.prizes.badge.desc') },
  ];

  return (
    <>
      <AppHeader />
      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-24 bg-[#f8f9fb]">
        <header className="mb-4 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex p-2 rounded-xl bg-amber-500/10 text-amber-600 mb-2 shadow-sm border border-amber-500/20"
          >
            <Trophy size={20} fill="currentColor" />
          </motion.div>
          <h2 className="text-xl font-black font-headline tracking-tighter text-foreground leading-none">
            {t('contest.title')}
          </h2>
          <p className="text-[9px] text-muted-foreground mt-1 font-medium uppercase tracking-widest opacity-70">
            {t('contest.subtitle')}
          </p>
        </header>

        <div className="bg-white rounded-2xl p-4 border border-border/40 app-shadow mb-8 flex items-center justify-center gap-4 max-w-[260px] mx-auto">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Timer size={20} />
          </div>
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground leading-none mb-1">{t('contest.ends_in')}</p>
            <p className="text-lg font-black tracking-tight leading-none">{timeLeft}</p>
          </div>
        </div>

        <Tabs defaultValue="female" className="w-full mb-8" onValueChange={setActiveGender}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-2xl h-12 mb-6">
            <TabsTrigger value="female" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
              {t('contest.tab.women')}
            </TabsTrigger>
            <TabsTrigger value="male" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
              {t('contest.tab.men')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeGender} className="mt-0 outline-none">
            <section className="mb-14 pt-24 relative">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeGender}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-center items-end gap-2 sm:gap-6 relative z-10"
                >
                  {/* Rank 2 */}
                  <div className="flex flex-col items-center flex-1 max-w-[120px]">
                    <div className="relative mb-3 cursor-pointer group" onClick={() => setViewerPhoto(topThree[1].photo)}>
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[1.5rem] border-4 border-slate-300 shadow-xl overflow-hidden bg-muted">
                        <Image src={topThree[1].photo} alt={topThree[1].userName} fill sizes="112px" className="object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="text-white" size={20} />
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md border-2 border-white">2</div>
                    </div>
                    <p className="font-bold text-xs truncate w-full text-center">{topThree[1].userName}</p>
                    <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-600 text-[8px] font-black">{topThree[1].votes}</Badge>
                  </div>

                  {/* Rank 1 */}
                  <div className="flex flex-col items-center flex-1 max-w-[160px] -mt-12">
                    <div className="relative mb-3 cursor-pointer group" onClick={() => setViewerPhoto(topThree[0].photo)}>
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-14 left-1/2 -translate-x-1/2 text-amber-500 drop-shadow-xl"
                      >
                        <Crown size={40} fill="currentColor" />
                      </motion.div>
                      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-[2rem] border-4 border-amber-400 shadow-[0_20px_50px_rgba(251,191,36,0.3)] overflow-hidden bg-muted ring-4 ring-amber-400/20">
                        <Image src={topThree[0].photo} alt={topThree[0].userName} fill sizes="144px" className="object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="text-white" size={32} />
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md border-2 border-white">1</div>
                    </div>
                    <p className="font-black text-sm truncate w-full text-center">{topThree[0].userName}</p>
                    <Badge className="mt-1 gradient-bg text-white text-[10px] font-black border-0 shadow-lg shadow-primary/20 px-3">{topThree[0].votes}</Badge>
                  </div>

                  {/* Rank 3 */}
                  <div className="flex flex-col items-center flex-1 max-w-[120px]">
                    <div className="relative mb-3 cursor-pointer group" onClick={() => setViewerPhoto(topThree[2].photo)}>
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[1.5rem] border-4 border-amber-700/40 shadow-xl overflow-hidden bg-muted">
                        <Image src={topThree[2].photo} alt={topThree[2].userName} fill sizes="112px" className="object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="text-white" size={20} />
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-700/60 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md border-2 border-white">3</div>
                    </div>
                    <p className="font-bold text-xs truncate w-full text-center">{topThree[2].userName}</p>
                    <Badge variant="secondary" className="mt-1 bg-amber-50 text-amber-700 text-[8px] font-black">{topThree[2].votes}</Badge>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-muted/30 to-transparent -z-0 rounded-b-[3rem]"></div>
            </section>
          </TabsContent>
        </Tabs>

        {/* Previous Winners Section */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4 px-1">
            <History className="text-blue-500" size={18} />
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('contest.previous_winners')}</h4>
          </div>
          <div className="grid grid-cols-3 gap-3 px-1">
            {pastWinners.slice(0, 3).map((winner) => (
              <div key={winner.id} className="w-full">
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-2 border-2 border-white shadow-sm bg-white">
                  <Image src={winner.photo} alt={winner.name} fill sizes="(max-width: 480px) 33vw, 128px" className="object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                  <div className="absolute top-1 right-1">
                    <div className="bg-amber-400 text-white p-1 rounded-full shadow-lg">
                      <Medal size={10} />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] font-black text-center truncate">{winner.name}</p>
                <p className="text-[8px] text-muted-foreground text-center uppercase font-bold">{winner.month}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Prizes block */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4 px-1">
            <Award className="text-primary" size={18} />
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('contest.prizes.title')}</h4>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {prizes.map((prize) => (
              <div key={prize.id} className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-border/40 app-shadow">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                  {prize.icon}
                </div>
                <div className="flex-1">
                  <h5 className="text-xs font-black leading-none">{prize.title}</h5>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">{prize.desc}</p>
                </div>
                <div className="text-primary/20">
                  <CheckCircle2 size={16} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 p-6 bg-primary/5 rounded-[2rem] border border-primary/10 border-dashed mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Info size={16} />
            </div>
            <h5 className="font-black text-xs uppercase tracking-tight text-primary">{t('contest.rules')}</h5>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
            {t('contest.rules_desc')}
          </p>
        </div>
      </main>

      <Dialog open={!!viewerPhoto} onOpenChange={(open) => !open && setViewerPhoto(null)}>
        <DialogContent className="max-w-[440px] w-[95vw] p-0 border-0 bg-transparent shadow-none flex flex-col items-center justify-center [&>button]:hidden">
          <DialogTitle className="sr-only">Photo Viewer</DialogTitle>
          <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden app-shadow">
            {viewerPhoto && (
              <Image src={viewerPhoto} alt="Contest entry" fill sizes="(max-width: 480px) 100vw, 440px" className="object-cover" />
            )}
          </div>
          <div className="absolute top-4 right-4 z-50">
            <Button data-testid="close-photo-viewer"
              variant="outline" 
              size="icon" 
              onClick={() => setViewerPhoto(null)} 
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border-white/20 text-white hover:bg-black/40 transition-all active:scale-90 shadow-lg"
            >
              <X size={20} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </>
  );
}
