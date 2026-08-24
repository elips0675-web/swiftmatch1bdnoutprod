import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Flag, MoveHorizontal as MoreHorizontal, Download, ShieldCheck, Ban, TriangleAlert as AlertTriangle, Circle as XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getToken } from "@/lib/token";

interface Report {
  id: number;
  reporterName: string;
  reportedUserName: string;
  reason: string;
  description: string;
  evidence: string;
  date: string;
  status: string;
}

interface ModLogEntry {
  id: number;
  date: string;
  admin: string;
  action: string;
  targetUser: string;
  reason: string;
}

interface BannedUser {
  id: number;
  name: string;
  email: string;
  city: string;
  joined: string;
}

const REPORT_STATUS_COLORS: Record<string, string> = {
  new: 'bg-red-100 text-red-800 border-red-200',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
  dismissed: 'bg-gray-100 text-gray-600',
  action_taken: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};
const REPORT_STATUS_LABELS: Record<string, string> = {
  new: 'Новая', reviewed: 'На рассмотрении', dismissed: 'Отклонена', action_taken: 'Действие принято',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [modLog, setModLog] = useState<ModLogEntry[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const apiGet = <T,>(url: string): Promise<T> => fetch(url, { headers }).then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); });
      const [r, log, users] = await Promise.all([
        apiGet<Report[]>('/api/admin/reports'),
        apiGet<ModLogEntry[]>('/api/admin/moderation-log'),
        apiGet<{ users: BannedUser[] }>('/api/admin/users?status=banned&page=1'),
      ]);
      setReports(r);
      setModLog(log);
      setBannedUsers(users.users);
    } catch {
      toast.error(t('admin.error.load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateReport = async (id: number, status: string) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/reports/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(`Жалоба #${id}: ${REPORT_STATUS_LABELS[status] || status}`);
      fetchData();
    } catch {
      toast.error(t('admin.error.operation'));
    }
  };

  const newCount = reports.filter(r => r.status === 'new').length;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="queue">
        <TabsList className="h-10 bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="queue" className="rounded-lg font-bold text-xs">
            Очередь модерации {newCount > 0 && <Badge variant="destructive" className="ml-2 text-[9px] h-5">{newCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="blocked" className="rounded-lg font-bold text-xs">Заблокированные ({bannedUsers.length})</TabsTrigger>
          <TabsTrigger value="log" className="rounded-lg font-bold text-xs">Лог действий ({modLog.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black flex items-center gap-2"><Flag className="h-5 w-5 text-destructive" /> Жалобы</CardTitle>
              <Button variant="outline" size="sm" className="rounded-xl h-8" onClick={() => {
                const csvRows = reports.map(r => ({ ID: r.id, На_кого: r.reportedUserName, От_кого: r.reporterName, Причина: r.reason, Статус: REPORT_STATUS_LABELS[r.status] || r.status, Дата: r.date }));
                if (!csvRows.length) return;
                const headers = Object.keys(csvRows[0]);
                const csv = [headers.join(','), ...csvRows.map(r => headers.map(h => `"${String(r[h as keyof typeof r] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'reports.csv'; link.click();
                URL.revokeObjectURL(link.href);
                toast.success(t('admin.content.csv_downloaded'));
              }}><Download size={12} className="mr-1" /> CSV</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>На кого</TableHead>
                    <TableHead className="hidden sm:table-cell">От кого</TableHead>
                    <TableHead>Причина</TableHead>
                    <TableHead className="hidden md:table-cell">Доказательства</TableHead>
                    <TableHead className="hidden md:table-cell">Дата</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-bold text-sm">{r.reportedUserName}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{r.reporterName}</TableCell>
                      <TableCell className="text-xs">{r.reason}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{r.evidence || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{r.date}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[9px] ${REPORT_STATUS_COLORS[r.status] || ''}`}>{REPORT_STATUS_LABELS[r.status] || r.status}</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><button className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => updateReport(r.id, 'dismissed')}><XCircle size={14} className="mr-2" /> Отклонить</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateReport(r.id, 'reviewed')}><AlertTriangle size={14} className="mr-2" /> Предупредить</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateReport(r.id, 'action_taken')} className="text-destructive"><Ban size={14} className="mr-2" /> Заблокировать</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t p-4">
              <span className="text-xs text-muted-foreground">Всего: {reports.length} жалоб</span>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="blocked">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-2"><Ban className="h-5 w-5" /> Заблокированные</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Город</TableHead>
                    <TableHead className="hidden md:table-cell">Регистрация</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bannedUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-bold text-sm">{u.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{u.city}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{u.joined}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="log">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-blue-500" /> Лог модерации</CardTitle>
              <Button variant="outline" size="sm" className="rounded-xl h-8" onClick={() => {
                const csvRows = modLog.map(e => ({ Дата: e.date, Админ: e.admin, Действие: e.action, Пользователь: e.targetUser, Причина: e.reason }));
                if (!csvRows.length) return;
                const headers = Object.keys(csvRows[0]);
                const csv = [headers.join(','), ...csvRows.map(r => headers.map(h => `"${String(r[h as keyof typeof r] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'moderation_log.csv'; link.click();
                URL.revokeObjectURL(link.href);
                toast.success(t('admin.content.csv_downloaded'));
              }}><Download size={12} className="mr-1" /> CSV</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Админ</TableHead>
                    <TableHead>Действие</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead className="hidden md:table-cell">Причина</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modLog.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs font-mono">{entry.date}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{entry.admin}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[9px]">{entry.action}</Badge></TableCell>
                      <TableCell className="font-bold text-sm">{entry.targetUser}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{entry.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
