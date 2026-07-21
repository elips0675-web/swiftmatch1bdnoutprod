import { Bell, Languages, LogIn, ChevronLeft, Sparkles, Heart, MessageCircle, User, Zap, X } from "lucide-react";
import Link from "@/shims/next-link";
import { useRouter, usePathname } from "@/shims/next-navigation";
import { useState, memo, useMemo } from "react";
import dynamic from "@/shims/next-dynamic";
import {
  Popover,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/context/language-context";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DropdownMenu = dynamic(() => import("@/components/ui/dropdown-menu").then((mod) => mod.DropdownMenu), { ssr: false });
const DropdownMenuContent = dynamic(() => import("@/components/ui/dropdown-menu").then((mod) => mod.DropdownMenuContent), { ssr: false });
const DropdownMenuItem = dynamic(() => import("@/components/ui/dropdown-menu").then((mod) => mod.DropdownMenuItem), { ssr: false });
const DropdownMenuTrigger = dynamic(() => import("@/components/ui/dropdown-menu").then((mod) => mod.DropdownMenuTrigger), { ssr: false });

const PopoverContent = dynamic(() => import("@/components/ui/popover").then(mod => mod.PopoverContent), { ssr: false });
const ScrollArea = dynamic(() => import("@/components/ui/scroll-area").then(mod => mod.ScrollArea), { ssr: false });

function getPageTitle(pathname: string, t: (k: string) => string): string {
  const titles: Record<string, string> = {
    "/search": t('nav.search'),
    "/search/filters": t('nav.filters'),
    "/chats": t('nav.chats'),
    "/profile": t('nav.profile'),
    "/profile/edit": t('nav.edit_profile'),
    "/profile/attachment-test": t('nav.attachment_test'),
    "/activity": t('nav.activity'),
    "/groups": t('nav.groups'),
    "/contest": t('nav.contest'),
    "/settings": t('nav.settings'),
    "/onboarding": t('nav.onboarding'),
    "/login": t('nav.login'),
    "/register": t('nav.register'),
    "/about": t('nav.about'),
    "/faq": t('nav.faq'),
    "/support-chat": t('nav.support'),
    "/legal/privacy": t('nav.legal_privacy'),
    "/legal/terms": t('nav.legal_terms'),
    "/legal/data-processing": t('nav.legal_data_processing'),
    "/admin": t('nav.admin'),
    "/admin/analytics": t('nav.admin_analytics'),
    "/admin/users": t('nav.admin_users'),
    "/admin/content": t('nav.admin_content'),
    "/admin/features": t('nav.admin_features'),
    "/admin/messaging": t('nav.admin_messaging'),
    "/admin/monetization": t('nav.admin_monetization'),
    "/admin/reports": t('nav.admin_reports'),
  };
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/chats/")) return t('nav.chat');
  if (pathname.startsWith("/groups/")) return t('nav.group_single');
  if (pathname.startsWith("/admin")) return t('nav.admin');
  return "";
}

export function AppHeader() {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(4);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const isHomePage = pathname === "/";
  const isLoginPage = pathname === "/login";
  const pageTitle = getPageTitle(pathname, t);

  const NOTIFICATIONS = useMemo(() => [
    {
      id: 1,
      type: 'like',
      text: t('notifications.liked_you'),
      time: t('time.min_ago'),
      icon: Heart,
      color: 'text-[#fe3c72]',
      bgColor: 'bg-[#fe3c72]/10'
    },
    {
      id: 2,
      type: 'match',
      text: t('notifications.new_match'),
      time: t('time.min_ago_2'),
      icon: Sparkles,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      id: 3,
      type: 'message',
      text: t('notifications.sent_message'),
      time: t('time.hour_ago'),
      icon: MessageCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 4,
      type: 'system',
      text: t('notifications.profile_popular'),
      time: t('time.hours_ago'),
      icon: Zap,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
  ], [language]);

  const handleLangChange = (newLang: 'RU' | 'EN') => {
    setLanguage(newLang);
    toast({
      title: t('toast.language_changed'),
      description: t('toast.language_selected'),
    });
  };

  if (isLoginPage) return null;

  return (
    <header className="sticky top-0 w-full bg-white/95 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center z-50 h-16">
      <div className="flex-1 flex items-center justify-start min-w-0">
        {!isHomePage && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full h-10 w-10 hover:bg-muted transition-colors flex-shrink-0"
          >
            <ChevronLeft size={24} />
          </Button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center min-w-0 px-2">
        {isHomePage || !pageTitle ? (
          <Link href="/" prefetch={true}>
            <h1 className="text-xl font-black font-headline gradient-text cursor-pointer tracking-tighter select-none active:scale-95 transition-transform text-center">
              SwiftMatch
            </h1>
          </Link>
        ) : (
          <h1 className="text-base font-black tracking-tight text-foreground select-none text-center truncate">
            {pageTitle}
          </h1>
        )}
      </div>

      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-9 px-3 rounded-full bg-muted/50 flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-95 gap-2 border border-transparent">
              <Languages size={15} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-tighter">{language}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl border-0 app-shadow p-1.5 min-w-[140px] bg-white">
            <DropdownMenuItem
              onClick={() => handleLangChange("RU")}
              className="rounded-xl font-bold text-[11px] uppercase tracking-wider cursor-pointer py-2.5 px-4"
            >
              {t('app.lang.ru')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleLangChange("EN")}
              className="rounded-xl font-bold text-[11px] uppercase tracking-wider cursor-pointer py-2.5 px-4"
            >
              {t('app.lang.en')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover onOpenChange={(open) => {
          setIsNotificationsOpen(open);
          if (open) setUnreadCount(0);
        }}>
          <PopoverTrigger asChild>
            <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-95 relative group">
              <Zap size={18} className={cn("transition-transform group-hover:scale-110", unreadCount > 0 && "text-primary fill-primary/10 animate-pulse")} />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] px-1.5 bg-primary text-white border-2 border-white flex items-center justify-center text-[9px] font-black shadow-lg shadow-primary/20 animate-in zoom-in duration-300">
                  {unreadCount}
                </Badge>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[340px] p-0 rounded-lg border-0 shadow-2xl bg-white overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            {isNotificationsOpen && (
              <>
                <div className="p-5 border-b border-border/50 bg-muted/10 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <h4 className="font-black text-[11px] uppercase tracking-[0.15em] text-foreground">
                      {t('settings.notifications')}
                    </h4>
                  </div>
                  <button className="text-[9px] font-black text-primary uppercase tracking-widest hover:opacity-70 transition-opacity">
                    {t('notifications.read_all')}
                  </button>
                </div>
                <ScrollArea className="h-[360px]">
                  <div className="flex flex-col py-2 px-3 space-y-1">
                    {NOTIFICATIONS.length > 0 ? (
                      NOTIFICATIONS.map((note) => {
                        const Icon = note.icon;
                        return (
                          <div
                            key={note.id}
                            className="p-3.5 rounded-xl hover:bg-muted/40 transition-all cursor-pointer group relative flex gap-4"
                          >
                            <div className={cn("mt-0.5 w-11 h-11 shrink-0 rounded-xl flex items-center justify-center shadow-sm border border-white transition-transform group-hover:scale-105", note.bgColor, note.color)}>
                              <Icon size={18} fill={note.type === 'like' ? 'currentColor' : 'none'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                {note.text}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">
                                  {note.time}
                                </p>
                                {note.id === 1 && (
                                  <Badge className="bg-primary/10 text-primary text-[7px] uppercase font-black px-1.5 py-0 border-0 h-3.5">New</Badge>
                                )}
                              </div>
                            </div>
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                               <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-12 text-center flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
                          <Bell size={24} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                          {t('notifications.empty')}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-4 bg-muted/5 text-center border-t border-border/50">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      router.push('/activity');
                      setIsNotificationsOpen(false);
                    }}
                    className="h-10 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/5 w-full rounded-xl border border-primary/10"
                  >
                    {t('notifications.all_events')}
                  </Button>
                </div>
              </>
            )}
          </PopoverContent>
        </Popover>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-[10px] font-black uppercase tracking-widest gap-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all h-9 px-3 ml-0.5 rounded-full"
        >
          <Link href="/login" prefetch={true}>
            <LogIn size={16} />
            <span className="hidden xs:block">{t('nav.login')}</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
