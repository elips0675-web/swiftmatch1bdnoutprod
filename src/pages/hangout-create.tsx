import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/context/language-context";
import { getToken } from "@/lib/token";
import { HANGOUT_CATEGORIES, type HangoutCategory } from "@/lib/hangouts";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const COMPANION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function defaultDateTime(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HangoutCreatePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [category, setCategory] = useState<HangoutCategory>("cinema");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [placeAddress, setPlaceAddress] = useState("");
  const [city, setCity] = useState("");
  const [eventDate, setEventDate] = useState(defaultDateTime());
  const [maxCompanions, setMaxCompanions] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim() || !eventDate) {
      toast.error(t("hangout.form.required"));
      return;
    }
    setSubmitting(true);
    try {
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        if (navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          lat = Number(pos.coords.latitude.toFixed(8));
          lng = Number(pos.coords.longitude.toFixed(8));
        }
      } catch {}

      const token = getToken();
      if (!token) { navigate("/login"); return; }
      const res = await fetch("/api/hangouts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category,
          title: title.trim(),
          description: description.trim() || undefined,
          place_name: placeName.trim() || undefined,
          place_address: placeAddress.trim() || undefined,
          city: city.trim() || undefined,
          lat,
          lng,
          event_date: new Date(eventDate).toISOString(),
          max_companions: maxCompanions,
        }),
      });
      if (!res.ok) throw new Error("failed");
      toast.success(t("hangout.toast.created"));
      navigate("/hangouts/my");
    } catch {
      toast.error(t("hangout.error.load"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <AppHeader title={t("hangout.action.create")} />
      <main className="px-4 pb-24 pt-4 max-w-2xl mx-auto">
        <Card className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="hangout-category">{t("hangout.form.category")}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as HangoutCategory)}>
              <SelectTrigger id="hangout-category" data-testid="hangout-category" aria-label={t("hangout.form.category")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HANGOUT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{t(`hangout.category.${c}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hangout-title">{t("hangout.form.title")}</Label>
            <Input
              id="hangout-title"
              data-testid="hangout-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("hangout.form.title_placeholder")}
              maxLength={255}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hangout-description">{t("hangout.form.description")}</Label>
            <Textarea
              id="hangout-description"
              data-testid="hangout-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("hangout.form.description_placeholder")}
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hangout-place">{t("hangout.form.place_name")}</Label>
              <Input
                id="hangout-place"
                data-testid="hangout-place"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder={t("hangout.form.place_name_placeholder")}
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hangout-address">{t("hangout.form.place_address")}</Label>
              <Input
                id="hangout-address"
                data-testid="hangout-address"
                value={placeAddress}
                onChange={(e) => setPlaceAddress(e.target.value)}
                maxLength={255}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hangout-city">{t("hangout.form.city")}</Label>
              <Input
                id="hangout-city"
                data-testid="hangout-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hangout-date">{t("hangout.form.date")}</Label>
              <Input
                id="hangout-date"
                data-testid="hangout-date"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("hangout.form.max_companions")}</Label>
            <Select
              value={String(maxCompanions)}
              onValueChange={(v) => setMaxCompanions(Number(v))}
            >
              <SelectTrigger data-testid="hangout-max-companions" aria-label={t("hangout.form.max_companions")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANION_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            data-testid="submit-hangout"
            onClick={submit}
            disabled={submitting}
            className="w-full rounded-full font-bold h-11"
          >
            {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
            {t("hangout.form.submit")}
          </Button>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
