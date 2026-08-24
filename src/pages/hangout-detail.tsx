import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/context/language-context";
import { useWebSocket } from "@/hooks/use-websocket";
import { getToken } from "@/lib/token";
import { formatEventDate, type Hangout } from "@/lib/hangouts";
import { categoryIcon } from "./hangouts";
import { CalendarDays, MapPin, Users, Check, X, MessageCircle, ArrowLeft, Compass, Pencil } from "lucide-react";
import { toast } from "sonner";

const RESPONSE_STATUS_KEYS: Record<string, string> = {
  pending: "hangout.response.pending",
  accepted: "hangout.response.accepted",
  declined: "hangout.response.declined",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-gray-100 text-gray-500",
};

export default function HangoutDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [hangout, setHangout] = useState<Hangout | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [respondOpen, setRespondOpen] = useState(false);
  const [respondMessage, setRespondMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/hangouts/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error("failed");
      const data: Hangout = await res.json();
      setHangout(data);
    } catch {
      toast.error(t("hangout.error.load"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const { socket } = useWebSocket();
  useEffect(() => {
    if (!socket) return;
    const refetch = () => { load(); };
    socket.on("hangout:new_response", refetch);
    socket.on("hangout:response_accepted", refetch);
    socket.on("hangout:cancelled", refetch);
    return () => {
      socket.off("hangout:new_response", refetch);
      socket.off("hangout:response_accepted", refetch);
      socket.off("hangout:cancelled", refetch);
    };
  }, [socket, load]);

  const respond = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/hangouts/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: respondMessage || undefined }),
      });
      if (res.status === 401) { navigate("/login"); return; }
      if (!res.ok) throw new Error("failed");
      setRespondOpen(false);
      setRespondMessage("");
      toast.success(t("hangout.toast.response_sent"));
      load();
    } catch {
      toast.error(t("hangout.error.load"));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelResponse = async () => {
    if (!id) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/hangouts/${id}/respond`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("failed");
      toast.info(t("hangout.toast.response_cancelled"));
      load();
    } catch {
      toast.error(t("hangout.error.load"));
    }
  };

  const decideResponse = async (responseId: number, status: "accepted" | "declined") => {
    if (!id) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/hangouts/${id}/responses/${responseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("failed");
      toast.success(t(status === "accepted" ? "hangout.toast.accepted" : "hangout.toast.declined"));
      load();
    } catch {
      toast.error(t("hangout.error.load"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <AppHeader title={t("hangout.title")} />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (notFound || !hangout) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <AppHeader title={t("hangout.title")} />
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Compass size={48} className="mb-4 opacity-30" />
          <p>{t("hangout.empty")}</p>
          <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate("/hangouts")}>
            <ArrowLeft size={16} className="mr-2" /> {t("hangout.action.back")}
          </Button>
        </div>
      </div>
    );
  }

  const Icon = categoryIcon(hangout.category);
  const myStatus = hangout.my_response_status;
  const acceptedCount = hangout.accepted_count ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <AppHeader title={t("hangout.title")} />
      <main className="px-4 pb-24 pt-4 max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" className="rounded-full -ml-2" onClick={() => navigate("/hangouts")}>
          <ArrowLeft size={16} className="mr-1" /> {t("hangout.action.back")}
        </Button>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              {hangout.avatar_url ? (
                <img src={hangout.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon size={22} className="text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm">{hangout.display_name}</p>
              <p className="text-xs text-muted-foreground">{t("hangout.label.author")}</p>
            </div>
            <Badge className="ml-auto border-transparent bg-primary/10 text-primary font-bold">
              {t(`hangout.category.${hangout.category}`)}
            </Badge>
          </div>

          <h1 className="text-lg font-black mt-4 leading-snug">{hangout.title}</h1>
          {hangout.description && (
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{hangout.description}</p>
          )}

          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <CalendarDays size={15} className="text-primary shrink-0" />
              <span className="text-muted-foreground mr-1">{t("hangout.label.when")}:</span>
              {formatEventDate(hangout.event_date)}
            </p>
            {(hangout.place_name || hangout.place_address || hangout.city) && (
              <p className="flex items-center gap-2">
                <MapPin size={15} className="text-primary shrink-0" />
                <span className="text-muted-foreground mr-1">{t("hangout.label.where")}:</span>
                {[hangout.place_name, hangout.place_address, hangout.city].filter(Boolean).join(", ")}
              </p>
            )}
            <p className="flex items-center gap-2">
              <Users size={15} className="text-primary shrink-0" />
              <span className="text-muted-foreground mr-1">{t("hangout.label.companions")}:</span>
              {t("hangout.label.companions_count", { count: acceptedCount, max: hangout.max_companions })}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Badge
              className={
                hangout.status === "active"
                  ? "bg-green-100 text-green-800 border-transparent"
                  : hangout.status === "blocked"
                    ? "bg-red-100 text-red-800 border-transparent"
                    : "bg-gray-100 text-gray-600 border-transparent"
              }
            >
              {t(`hangout.status.${hangout.status}`)}
            </Badge>
            {typeof hangout.distance_km === "number" && (
              <span className="text-xs text-muted-foreground">{t("hangout.label.distance", { km: hangout.distance_km })}</span>
            )}
          </div>
        </Card>

        {hangout.is_author && hangout.status === "active" && (
          <Link to={`/hangouts/${hangout.id}/edit`}>
            <Button data-testid="edit-hangout" variant="outline" className="w-full rounded-full mt-3">
              <Pencil size={15} className="mr-2" /> {t("hangout.action.edit")}
            </Button>
          </Link>
        )}

        {!hangout.is_author && (
          <Card className="p-4">
            {myStatus === null || myStatus === "cancelled" || myStatus === "declined" ? (
              <>
                <p className="font-semibold text-sm mb-3">{t("hangout.detail.want_join")}</p>
                <Button
                  data-testid="respond-button"
                  className="w-full rounded-full font-bold"
                  disabled={hangout.status !== "active"}
                  onClick={() => {
                    const token = getToken();
                    if (!token) { navigate("/login"); return; }
                    setRespondOpen(true);
                  }}
                >
                  {t("hangout.action.respond")}
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge className={`border-transparent ${STATUS_COLORS[myStatus]}`}>
                    {t("hangout.label.you_responded")} · {t(RESPONSE_STATUS_KEYS[myStatus] || "")}
                  </Badge>
                </div>
                {myStatus === "pending" && (
                  <Button data-testid="cancel-response-button" variant="outline" className="w-full rounded-full" onClick={cancelResponse}>
                    <X size={15} className="mr-2" /> {t("hangout.action.cancel_response")}
                  </Button>
                )}
              </div>
            )}
          </Card>
        )}

        {hangout.is_author && (
          <Card className="p-4">
            <p className="font-bold text-sm mb-3">{t("hangout.label.responses")}</p>
            {!hangout.responses || hangout.responses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">{t("hangout.label.no_responses_yet")}</p>
            ) : (
              <div className="space-y-3">
                {hangout.responses.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl border bg-background">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold">{(r.display_name || "?").slice(0, 1)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/profile/${r.user_id}`} className="text-sm font-semibold hover:underline truncate">
                          {r.display_name}
                        </Link>
                        <Badge className={`text-[10px] border-transparent ${STATUS_COLORS[r.status]}`}>
                          {t(RESPONSE_STATUS_KEYS[r.status] || "")}
                        </Badge>
                      </div>
                      {r.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.message}</p>}
                      {r.status === "pending" && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            data-testid={`accept-response-${r.id}`}
                            size="sm"
                            className="rounded-full h-8 px-4"
                            onClick={() => decideResponse(r.id, "accepted")}
                          >
                            <Check size={14} className="mr-1" /> {t("hangout.action.accept")}
                          </Button>
                          <Button
                            data-testid={`decline-response-${r.id}`}
                            size="sm"
                            variant="outline"
                            className="rounded-full h-8 px-4"
                            onClick={() => decideResponse(r.id, "declined")}
                          >
                            <X size={14} className="mr-1" /> {t("hangout.action.decline")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {hangout.chat_id && (
              <Link to={`/chats/${hangout.chat_id}`}>
                <Button variant="outline" className="w-full rounded-full mt-3">
                  <MessageCircle size={15} className="mr-2" /> {t("hangout.action.open_chat")}
                </Button>
              </Link>
            )}
          </Card>
        )}
      </main>

      <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("hangout.detail.want_join")}</DialogTitle>
            <DialogDescription>{hangout.title}</DialogDescription>
          </DialogHeader>
          <Textarea
            data-testid="response-message"
            value={respondMessage}
            onChange={(e) => setRespondMessage(e.target.value)}
            placeholder={t("hangout.message_placeholder")}
            rows={3}
            maxLength={500}
          />
          <DialogFooter>
            <Button variant="ghost" className="rounded-full" onClick={() => setRespondOpen(false)}>
              {t("hangout.action.cancel")}
            </Button>
            <Button data-testid="submit-response" className="rounded-full font-bold" disabled={submitting} onClick={respond}>
              {t("hangout.action.respond")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
