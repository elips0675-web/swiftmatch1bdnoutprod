import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, Image, Clock, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/language-context';
import { getToken } from '@/lib/token';

interface Photo {
  id: number;
  url: string;
  user_id: number;
  created_at: string;
  display_name: string;
  avatar_url: string;
  moderation_status: string;
}

export default function AdminPhotosPage() {
  const { t } = useLanguage();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'pending'>('all');

  const fetchPhotos = async () => {
    try {
      const token = getToken();
      const endpoint = filter === 'pending' ? '/api/admin/photos/pending' : '/api/admin/photos';
      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setPhotos(await res.json());
    } catch { /* ignored */ } finally { setLoading(false) }
  };

  useEffect(() => { fetchPhotos() }, [filter]);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/photos/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: action === 'reject' ? JSON.stringify({ reason: 'Inappropriate content' }) : undefined,
      });
      if (res.ok) {
        setPhotos(prev => prev.filter(p => p.id !== id));
        toast.success(action === 'approve' ? 'Photo approved' : 'Photo rejected');
      }
    } catch { /* ignored */ } finally { setSaving(prev => ({ ...prev, [id]: false })) }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">{t('admin.photos.title')}</h2>
          <p className="text-sm text-slate-400">{photos.length} photos</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={filter === 'all' ? 'default' : 'secondary'} onClick={() => setFilter('all')} className="rounded-full">
            <Image size={14} className="mr-1" /> All
          </Button>
          <Button size="sm" variant={filter === 'pending' ? 'default' : 'secondary'} onClick={() => setFilter('pending')} className="rounded-full">
            <Clock size={14} className="mr-1" /> Pending
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
      ) : photos.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-20 text-center text-slate-500">
            <Image size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold">{t('admin.photos.empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map(photo => (
            <Card key={photo.id} className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <div className="aspect-[4/3] bg-slate-700 relative">
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
                <Badge className="absolute top-2 right-2 bg-black/60 text-white border-0 text-[10px]">
                  {photo.moderation_status}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300">{photo.display_name}</Badge>
                  <Badge variant="outline" className="text-slate-400 border-slate-600">#{photo.user_id}</Badge>
                </div>
                {filter !== 'all' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAction(photo.id, 'approve')} disabled={saving[photo.id]} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      {saving[photo.id] ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                      {' '}{t('admin.photos.approve')}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(photo.id, 'reject')} disabled={saving[photo.id]} className="flex-1">
                      {saving[photo.id] ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />}
                      {' '}{t('admin.photos.reject')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
