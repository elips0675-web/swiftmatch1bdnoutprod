import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/context/language-context";
import { useFeatureFlags } from "@/context/feature-flags-context";
import { getToken } from "@/lib/token";
import { HANGOUT_CATEGORIES, formatEventDate, type Hangout } from "@/lib/hangouts";
import { Clapperboard, Theater, Palette, Coffee, Music, Dumbbell, Sparkles, CalendarDays, MapPin, Users, PlusCircle, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export const categoryIcon = (category: string) => {
  const map: Record<string, React.ElementType> = {
    cinema: Clapperboard,
    theater: Theater,
    exhibition: Palette,
    cafe: Coffee,
    concert: Music,
    sport: Dumbbell,
    other: Sparkles,
  };
  return map[category] || Sparkles;
};

const CATEGORY_COLORS: Record<string, string> = {
  cinema: "bg-purple-100 text-purple-700",
  theater: "bg-rose-100 text-rose-700",
  exhibition: "bg-amber-100 text-amber-700",
  cafe: "bg-orange-100 text-orange-700",
  concert: "bg-indigo-100 text-indigo-700",
  sport: "bg-emerald-100 text-emerald-700",
  other: "bg-slate-100 text-slate-600",
};

export type HangoutDateFilter = "all" | "today" | "tomorrow" | "weekend";

const PAGE_LIMIT = 20;

function dateRange(filter: HangoutDateFilter): { from?: string; to?: string } {
  if (filter === "all") return {};
  const now = new Date();
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  if (filter === "today") {
    return { from: now.toISOString(), to: endOfDay(now).toISOString() };
  }
  if (filter === "tomorrow") {
    const tmr = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { from: tmr.toISOString(), to: endOfDay(tmr).toISOString() };
  }
  // Ближайшие выходные: суббота и воскресенье (включая текущие)
  const day = now.getDay();
  const daysToSat = day === 0 ? -1 : (6 - day) % 7;
  const sat = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToSat);
  return { from: sat.toISOString(), to: endOfDay(new Date(sat.getFullYear(), sat.getMonth(), sat.getDate() + 1)).toISOString() };
}

function HangoutCard({ hangout }: { hangout: Hangout }) {
  const { t } = useLanguage();
  const Icon = categoryIcon(hangout.category);

  return (
    <Link to={`/hangouts/${hangout.id}`} className="block">
      <Card data-testid={`hangout-card-${hangout.id}`} className="p-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {hangout.avatar_url ? (
              <img src={hangout.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Icon size={20} className="text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("text-[10px] font-bold border-transparent", CATEGORY_COLORS[hangout.category])}>
                {t(`hangout.category.${hangout.category}`)}
              </Badge>
              <span className="text-[11px] text-muted-foreground truncate">{hangout.display_name}</span>
            </div>
            <p className="font-semibold text-sm mt-1.5 leading-snug line-clamp-2">{hangout.title}</p>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <CalendarDays size={12} />
                {formatEventDate(hangout.event_date)}
              </p>
              {(hangout.place_name || hangout.city) && (
                <p className="flex items-center gap-1.5 truncate">
                  <MapPin size={12} />
                  {[hangout.place_name, hangout.city].filter(Boolean).join(", ")}
                </p>
              )}
              <p className="flex items-center gap-1.5">
                <Users size={12} />
                {t("hangout.label.companions_count", { count: hangout.accepted_count ?? 0, max: hangout.max_companions })}
                {typeof hangout.distance_km === "number" && (
                  <span className="ml-1">· {t("hangout.label.distance", { km: hangout.distance_km })}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function HangoutsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { hangoutsEnabled } = useFeatureFlags();
  const [items, setItems] = useState<Hangout[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<HangoutDateFilter>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoAsked, setGeoAsked] = useState(false);

  useEffect(() => {
    if (!geoAsked && navigator.geolocation) {
      setGeoAsked(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000 },
      );
    }
  }, [geoAsked]);

  useEffect(() => {
    if (!hangoutsEnabled) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    const range = dateRange(dateFilter);
    if (range.from) params.set("date_from", range.from);
    if (range.to) params.set("date_to", range.to);
    params.set("page", String(page));
    params.set("limit", String(PAGE_LIMIT));
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
      params.set("radius", String(radiusKm));
    }
    const token = getToken();
    fetch(`/api/hangouts?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : [];
        setItems((prev) => (page > 1 ? [...prev, ...arr] : arr));
        setHasMore(arr.length >= PAGE_LIMIT);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [category, dateFilter, page, coords, radiusKm, hangoutsEnabled]);

  const chips = useMemo(
    () => [{ key: null, label: t("hangout.filter.all_categories") }, ...HANGOUT_CATEGORIES.map((c) => ({ key: c as string, label: t(`hangout.category.${c}`) }))],
    [t],
  );

  const dateChips = useMemo(
    () => [
      { key: "all" as HangoutDateFilter, label: t("hangout.filter.all_dates") },
      { key: "today" as HangoutDateFilter, label: t("hangout.filter.today") },
      { key: "tomorrow" as HangoutDateFilter, label: t("hangout.filter.tomorrow") },
      { key: "weekend" as HangoutDateFilter, label: t("hangout.filter.weekend") },
    ],
    [t],
  );

  const applyCategory = (key: string | null) => {
    setPage(1);
    setCategory(key);
  };

  const applyDateFilter = (key: HangoutDateFilter) => {
    setPage(1);
    setDateFilter(key);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <AppHeader title={t("hangout.title")} />
      <main className="px-4 pb-24 pt-4 max-w-2xl mx-auto space-y-4">
        {!hangoutsEnabled ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground" data-testid="hangouts-disabled">
            <Compass size={48} className="mb-4 opacity-30" />
            <p className="font-semibold">{t("hangout.disabled")}</p>
            <p className="text-sm mt-1">{t("hangout.disabled_desc")}</p>
          </div>
        ) : (
          <>
            <Button
              data-testid="create-hangout"
              onClick={() => navigate("/hangouts/create")}
              className="w-full rounded-full font-bold"
              size="lg"
            >
              <PlusCircle size={18} className="mr-2" />
              {t("hangout.action.create")}
            </Button>

            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" data-testid="hangout-category-chips">
              {chips.map((chip) => (
                <button
                  key={chip.key ?? "all"}
                  type="button"
                  aria-pressed={category === chip.key}
                  data-testid={chip.key ? `hangout-category-${chip.key}` : "hangout-category-all"}
                  onClick={() => applyCategory(chip.key)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                    category === chip.key
                      ? "gradient-bg border-0 text-white shadow-md"
                      : "bg-background border-muted text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" data-testid="hangout-date-chips">
              {dateChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  aria-pressed={dateFilter === chip.key}
                  data-testid={`hangout-date-${chip.key}`}
                  onClick={() => applyDateFilter(chip.key)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                    dateFilter === chip.key
                      ? "gradient-bg border-0 text-white shadow-md"
                      : "bg-background border-muted text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="px-1">
              <Slider
                value={[radiusKm]}
                min={1}
                max={50}
                step={1}
                onValueChange={(v) => setRadiusKm(v[0])}
                aria-label={t("hangout.filter.radius", { km: radiusKm })}
              />
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <MapPin size={12} />
                {t("hangout.filter.radius", { km: radiusKm })}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <CalendarDays size={48} className="mb-4 opacity-30" />
                <p>{t("hangout.empty")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((h) => (
                  <HangoutCard key={h.id} hangout={h} />
                ))}
                {hasMore && (
                  <Button
                    data-testid="hangouts-load-more"
                    variant="outline"
                    className="w-full rounded-full font-bold"
                    disabled={loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("hangout.filter.load_more")}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
