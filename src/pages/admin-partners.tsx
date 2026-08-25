import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Handshake, Plus, Pause, CircleCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";
import { getToken } from "@/lib/token";

interface AdminPartner {
  id: number;
  name: string;
  type: string;
  commission_rate: string | number;
  hmac_secret: string | null;
  status: 'active' | 'paused';
  offers_count: number;
  clicks_total: number;
  conversions_total: number;
  commission_pending: string | number;
}

interface AdminOffer {
  id: number;
  partner_id: number;
  partner_name: string;
  category: string;
  title: string;
  placement: string;
  status: 'active' | 'paused';
  clicks_total: number;
}

interface AdminConversion {
  id: number;
  partner_id: number;
  partner_name: string;
  offer_id: number | null;
  offer_title: string | null;
  user_id: number | null;
  user_email: string | null;
  conversion_type: string;
  external_order_id: string | null;
  amount: number | null;
  commission: number | null;
  status: string;
  created_at: string;
}

const OFFER_CATEGORIES = ['cinema', 'restaurant', 'flowers', 'taxi', 'hotel', 'spa', 'photo', 'gift', 'event', 'experience'];
const PLACEMENT_OPTIONS = ['chat', 'hangout', 'profile', 'passport'];

export default function AdminPartnersPage() {
  const { t } = useLanguage();
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [conversions, setConversions] = useState<AdminConversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("deeplink");
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerForm, setOfferForm] = useState({ partner_id: "", category: "taxi", title: "", deeplink: "", placement: "chat" });
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [pRes, oRes, cRes] = await Promise.all([
        fetch('/api/admin/partners', { headers }),
        fetch('/api/admin/offers', { headers }),
        fetch('/api/admin/conversions', { headers }),
      ]);
      const pData = pRes.ok ? await pRes.json() : [];
      const oData = oRes.ok ? await oRes.json() : [];
      const cData = cRes.ok ? await cRes.json() : [];
      setPartners(Array.isArray(pData) ? pData : []);
      setOffers(Array.isArray(oData) ? oData : []);
      setConversions(Array.isArray(cData) ? cData : []);
    } catch {
      toast.error(t('error.generic_title'));
      setPartners([]);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const togglePartner = async (p: AdminPartner) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/partners/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: p.status === 'active' ? 'paused' : 'active' }),
      });
      if (!res.ok) throw new Error('failed');
      fetchData();
    } catch {
      toast.error(t('error.generic_title'));
    }
  };

  const createPartner = async () => {
    if (newName.trim().length < 2) return;
    setBusy(true);
    try {
      const token = getToken();
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: newName.trim(), type: newType }),
      });
      if (!res.ok) throw new Error('failed');
      setNewName("");
      setCreateOpen(false);
      toast.success(t('admin.features.saved'));
      fetchData();
    } catch {
      toast.error(t('error.generic_title'));
    } finally {
      setBusy(false);
    }
  };

  const createOffer = async () => {
    if (!offerForm.partner_id || offerForm.title.trim().length < 3 || !offerForm.deeplink.trim()) return;
    setBusy(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/partners/${offerForm.partner_id}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          category: offerForm.category,
          title: offerForm.title.trim(),
          deeplink: offerForm.deeplink.trim(),
          placement: offerForm.placement,
        }),
      });
      if (!res.ok) throw new Error('failed');
      setOfferForm({ partner_id: "", category: "taxi", title: "", deeplink: "", placement: "chat" });
      setOfferOpen(false);
      toast.success(t('admin.features.saved'));
      fetchData();
    } catch {
      toast.error(t('error.generic_title'));
    } finally {
      setBusy(false);
    }
  };

  const toggleOffer = async (o: AdminOffer) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/offers/${o.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: o.status === 'active' ? 'paused' : 'active' }),
      });
      if (!res.ok) throw new Error('failed');
      fetchData();
    } catch {
      toast.error(t('error.generic_title'));
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <CardTitle className="text-lg font-black flex items-center gap-2">
          <Handshake className="h-5 w-5 text-primary" />
          {t('admin.partners')}
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" data-testid="add-offer-button" onClick={() => setOfferOpen(true)} className="rounded-full h-9 px-4 text-xs font-bold">
            <Plus size={13} className="mr-1" /> {t('admin.partners.add_offer')}
          </Button>
          <Button size="sm" data-testid="add-partner-button" onClick={() => setCreateOpen(true)} className="rounded-full h-9 px-4 text-xs font-bold">
            <Plus size={13} className="mr-1" /> {t('admin.partners.add')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">ID</TableHead>
                  <TableHead>{t('admin.partners.name')}</TableHead>
                  <TableHead className="w-24">{t('admin.partners.type')}</TableHead>
                  <TableHead className="w-20">{t('admin.partners.rate')}</TableHead>
                  <TableHead className="w-28">HMAC Secret</TableHead>
                  <TableHead className="w-20">{t('admin.partners.offers')}</TableHead>
                  <TableHead className="w-20">{t('admin.partners.clicks')}</TableHead>
                  <TableHead className="w-24">{t('admin.partners.conversions')}</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">—</TableCell></TableRow>
                ) : partners.map((p) => (
                  <TableRow key={p.id} data-testid={`admin-partner-${p.id}`}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell className="text-sm font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{p.type}</Badge></TableCell>
                    <TableCell className="text-xs">{Number(p.commission_rate).toFixed(1)}%</TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]" title={p.hmac_secret ?? '—'}>{p.hmac_secret ? `${p.hmac_secret.slice(0, 8)}…` : '—'}</TableCell>
                    <TableCell className="text-sm">{p.offers_count}</TableCell>
                    <TableCell className="text-sm font-bold">{p.clicks_total}</TableCell>
                    <TableCell className="text-sm">{p.conversions_total}</TableCell>
                    <TableCell>
                      {p.status === 'active' ? (
                        <Button size="sm" variant="outline" data-testid={`pause-partner-${p.id}`} onClick={() => togglePartner(p)} className="rounded-full h-8 px-3 text-xs">
                          <Pause size={12} className="mr-1" /> {t('admin.partners.pause')}
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" data-testid={`activate-partner-${p.id}`} onClick={() => togglePartner(p)} className="rounded-full h-8 px-3 text-xs text-green-700 hover:text-green-700">
                          <CircleCheck size={12} className="mr-1" /> {t('admin.partners.activate')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div>
              <h3 className="text-sm font-black uppercase tracking-tight mb-2">{t('admin.partners.offers_list')}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">ID</TableHead>
                    <TableHead>{t('hangout.form.title')}</TableHead>
                    <TableHead>{t('admin.partners.name')}</TableHead>
                    <TableHead className="w-28">{t('hangout.form.category')}</TableHead>
                    <TableHead className="w-36">Placement</TableHead>
                    <TableHead className="w-20">{t('admin.partners.clicks')}</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">—</TableCell></TableRow>
                  ) : offers.map((o) => (
                    <TableRow key={o.id} data-testid={`admin-offer-${o.id}`}>
                      <TableCell className="font-mono text-xs">{o.id}</TableCell>
                      <TableCell className="text-sm font-medium truncate max-w-[220px]">{o.title}</TableCell>
                      <TableCell className="text-sm truncate max-w-[140px]">{o.partner_name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{t(`partner.category.${o.category}`)}</Badge></TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">{o.placement}</TableCell>
                      <TableCell className="text-sm font-bold">{o.clicks_total}</TableCell>
                      <TableCell>
                        {o.status === 'active' ? (
                          <Button size="sm" variant="outline" data-testid={`pause-offer-${o.id}`} onClick={() => toggleOffer(o)} className="rounded-full h-8 px-3 text-xs">
                            <Pause size={12} className="mr-1" /> {t('admin.partners.pause')}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" data-testid={`activate-offer-${o.id}`} onClick={() => toggleOffer(o)} className="rounded-full h-8 px-3 text-xs text-green-700 hover:text-green-700">
                            <CircleCheck size={12} className="mr-1" /> {t('admin.partners.activate')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="text-sm font-black uppercase tracking-tight mb-2">{t('admin.partners.conversions_list')}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">ID</TableHead>
                    <TableHead>{t('admin.partners.name')}</TableHead>
                    <TableHead>{t('hangout.form.title')}</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead className="w-28">External ID</TableHead>
                    <TableHead className="w-20">Amount</TableHead>
                    <TableHead className="w-20">Commission</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead className="w-36">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversions.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-6">—</TableCell></TableRow>
                  ) : conversions.map((c) => (
                    <TableRow key={c.id} data-testid={`admin-conversion-${c.id}`}>
                      <TableCell className="font-mono text-xs">{c.id}</TableCell>
                      <TableCell className="text-sm truncate max-w-[120px]">{c.partner_name}</TableCell>
                      <TableCell className="text-sm truncate max-w-[180px]">{c.offer_title ?? '—'}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{c.conversion_type}</Badge></TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground truncate max-w-[140px]">{c.external_order_id ?? '—'}</TableCell>
                      <TableCell className="text-sm font-medium">{c.amount != null ? `$${Number(c.amount).toFixed(2)}` : '—'}</TableCell>
                      <TableCell className="text-sm font-bold text-green-700">{c.commission != null ? `$${Number(c.commission).toFixed(2)}` : '—'}</TableCell>
                      <TableCell><Badge variant={c.status === 'approved' ? 'default' : 'secondary'} className="text-[10px]">{c.status}</Badge></TableCell>
                      <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(c.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.partners.add')}</DialogTitle>
            <DialogDescription>{t('admin.partners.add')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="partner-name">{t('admin.partners.name')}</Label>
              <Input id="partner-name" data-testid="partner-name" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('admin.partners.type')}</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger data-testid="partner-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deeplink">deeplink</SelectItem>
                  <SelectItem value="api">api</SelectItem>
                  <SelectItem value="saas">saas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button data-testid="submit-create-partner" onClick={createPartner} disabled={busy || newName.trim().length < 2} className="w-full rounded-full font-bold">
              {busy && <Loader2 size={14} className="mr-2 animate-spin" />} {t('admin.features.save_btn')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.partners.add_offer')}</DialogTitle>
            <DialogDescription>{t('admin.partners.add_offer')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('admin.partners.name')}</Label>
              <Select value={offerForm.partner_id} onValueChange={(v) => setOfferForm((f) => ({ ...f, partner_id: v }))}>
                <SelectTrigger data-testid="offer-partner"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('hangout.form.category')}</Label>
              <Select value={offerForm.category} onValueChange={(v) => setOfferForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger data-testid="offer-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OFFER_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{t(`partner.category.${c}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-title">{t('hangout.form.title')}</Label>
              <Input id="offer-title" data-testid="offer-title" value={offerForm.title} onChange={(e) => setOfferForm((f) => ({ ...f, title: e.target.value }))} maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-deeplink">Deeplink / URL</Label>
              <Input id="offer-deeplink" data-testid="offer-deeplink" value={offerForm.deeplink} onChange={(e) => setOfferForm((f) => ({ ...f, deeplink: e.target.value }))} maxLength={500} />
            </div>
            <div className="space-y-1.5">
              <Label>Placement</Label>
              <Select value={offerForm.placement} onValueChange={(v) => setOfferForm((f) => ({ ...f, placement: v }))}>
                <SelectTrigger data-testid="offer-placement"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLACEMENT_OPTIONS.map((pl) => (
                    <SelectItem key={pl} value={pl}>{pl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button data-testid="submit-create-offer" onClick={createOffer} disabled={busy || !offerForm.partner_id || offerForm.title.trim().length < 3 || !offerForm.deeplink.trim()} className="w-full rounded-full font-bold">
              {busy && <Loader2 size={14} className="mr-2 animate-spin" />} {t('admin.features.save_btn')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
