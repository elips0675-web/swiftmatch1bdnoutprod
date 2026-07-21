
import { useState } from 'react';
import Image from "@/shims/next-image";
import { Camera, Trash2, Loader as Loader2, CloudUpload as UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { getToken } from '@/lib/token';
import { useLanguage } from '@/context/language-context';

interface PhotoUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

export const PhotoUploader = ({ photos, onPhotosChange }: PhotoUploaderProps) => {
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState<boolean[]>(new Array(photos.length).fill(false));

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPhotos = [...photos];
    const newUploadingStates = [...isUploading];

    // Сначала добавляем плейсхолдеры и устанавливаем состояние загрузки
    for (let i = 0; i < files.length; i++) {
        const placeholderIndex = newPhotos.length;
        newPhotos.push(''); // Плейсхолдер для UI
        newUploadingStates.push(true);
        onPhotosChange(newPhotos); // Обновляем UI с плейсхолдерами
        setIsUploading(newUploadingStates);

        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                },
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                // Заменяем плейсхолдер на реальный URL
                newPhotos[placeholderIndex] = result.url;
            } else {
                // Удаляем плейсхолдер в случае ошибки
                newPhotos.splice(placeholderIndex, 1);
                toast({ title: t('upload.error'), description: t('upload.failed', { name: file.name }), variant: "destructive" });
            }
        } catch (error) {
            newPhotos.splice(placeholderIndex, 1);
            if (import.meta.env.DEV) console.error('Upload error:', error);
            toast({ title: t('upload.network_error'), description: t('upload.network_failed', { name: file.name }), variant: "destructive" });
        } finally {
            newUploadingStates[placeholderIndex] = false;
        }
    }
    
    // Финальное обновление состояния
    onPhotosChange([...newPhotos.filter(p => p)]); // Убираем пустые строки, если остались
    setIsUploading(newUploadingStates.filter((_, i) => newPhotos[i]));
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    if (photos.length <= 1) {
      toast({ title: t('upload.cannot_delete'), description: t('upload.min_photo_required'), variant: "destructive" });
      return;
    }
    const newPhotos = photos.filter((_, index) => index !== indexToRemove);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-600"><Camera size={14} /></div>
                <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">{t('upload.photos')}</h3>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            id="photo-upload-input"
            className="hidden"
          />
          <Button asChild variant="ghost" size="sm">
            <label htmlFor="photo-upload-input" className="cursor-pointer text-primary font-bold text-xs uppercase tracking-widest">{t('upload.upload')}</label>
          </Button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo, index) => (
          <div key={photo} className="relative aspect-square rounded-xl overflow-hidden group bg-muted">
            {isUploading[index] ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : (
              <Image src={photo} alt={t('upload.photo_alt', { num: index + 1 })} fill className="object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="destructive"
                size="icon"
                className="w-9 h-9 rounded-full bg-red-500/80"
                onClick={() => handleRemovePhoto(index)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
        <label htmlFor="photo-upload-input" className="cursor-pointer aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 hover:border-primary transition-colors">
            <UploadCloud size={24} />
            <span className="text-[10px] font-bold mt-1 text-center">Добавить фото</span>
        </label>
      </div>
    </div>
  );
};
