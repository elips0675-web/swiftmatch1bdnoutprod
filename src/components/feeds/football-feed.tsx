import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Heart, MessageCircle, MoveHorizontal as MoreHorizontal, Send, Share2, ChevronLeft, ChevronRight, ChevronDown, Search, CirclePlus as PlusCircle, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/language-context";
import { containsForbiddenWords, isGibberish } from "@/lib/word-filter";
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";


// --- PostText with Spoiler ---
const PostText = ({ text, charLimit = 280 }: { text: string, charLimit?: number }) => {
  const { language } = useLanguage();
  const tr = (ru: string, en: string) => (language === "RU" ? ru : en);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;
  if (text.length <= charLimit) {
    return <p className="px-5 pb-2 text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">{text}</p>;
  }

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="px-5 pb-2 text-gray-800 text-[15px] leading-relaxed">
      <p className="whitespace-pre-wrap">
        {isExpanded ? text : `${text.substring(0, charLimit)}...`}
        <button onClick={toggleExpand} className="text-blue-500 hover:underline ml-1 font-semibold text-sm">
          {isExpanded ? tr("Скрыть", "Hide") : tr("Показать больше", "Show more")}
        </button>
      </p>
    </div>
  );
};

// --- Lightbox Component ---
const Lightbox = ({
  images,
  selectedIndex,
  onClose,
}: {
  images: string[];
  selectedIndex: number;
  onClose: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);

  const goToNext = useCallback((e: React.MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback((e: React.MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goToNext(e);
      if (e.key === 'ArrowLeft') goToPrevious(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goToNext, goToPrevious]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="max-h-[90vh] max-w-[90vw] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </AnimatePresence>

      <button
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-[101]"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X size={32} />
      </button>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-all z-[101]"
            onClick={goToPrevious}
          >
            <ChevronLeft size={28} />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-all z-[101]"
            onClick={goToNext}
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}
    </motion.div>
  );
};

// --- Post Image Gallery Component ---
const PostImageGallery = ({ images }: { images: string[] }) => {
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const count = images.length;
  if (count === 0) return null;

  return (
    <div className="px-5 pt-1">
      <div className={cn("mt-2 rounded-xl overflow-hidden border border-gray-200/80 grid gap-0.5", count === 1 ? "grid-cols-1" : "grid-cols-2")}>
        {images.slice(0, count === 1 ? 1 : count === 2 ? 2 : 4).map((src, index) => (
          <div
            key={src}
            className={cn("bg-gray-200 cursor-pointer overflow-hidden", count === 3 && index === 0 ? "col-span-2 row-span-2" : "aspect-square")}
            onClick={() => { setSelectedIndex(index); setLightboxOpen(true); }}
          >
            <img src={src} alt={`Post image ${index + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      {isLightboxOpen && <Lightbox images={images} selectedIndex={selectedIndex} onClose={() => setLightboxOpen(false)} />}
    </div>
  );
};

// --- Post Image Uploader Component ---
const PostImageUploader = ({
  images,
  setImages,
  newPostImageUrls,
  setNewPostImageUrls,
}: {
  images: string[];
  setImages: (images: string[]) => void;
  newPostImageUrls: string;
  setNewPostImageUrls: (urls: string) => void;
}) => {
  const { language } = useLanguage();
  const tr = (ru: string, en: string) => (language === "RU" ? ru : en);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxFiles = 14;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files).slice(0, maxFiles - images.length);

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImages([...images, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
          {tr("Добавить фото", "Add photos")} ({images.length}/{maxFiles})
        </Label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((image, index) => (
            <div key={image} className="relative aspect-square rounded-lg overflow-hidden border">
              <img src={image} alt={`preview ${index}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 backdrop-blur-sm hover:bg-black/80 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {images.length < maxFiles && (
            <button
              type="button"
              onClick={triggerFileInput}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
            >
              <PlusCircle size={24} />
              <span className="text-xs font-semibold mt-1">{tr("Добавить", "Add")}</span>
            </button>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/gif, image/webp"
          multiple
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="post-images-url" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
          {tr("Или по ссылке", "Or by link")}
        </Label>
        <Input
          id="post-images-url"
          value={newPostImageUrls}
          onChange={(e) => setNewPostImageUrls(e.target.value)}
          className="h-12 rounded-xl bg-muted/50 border-0"
          placeholder={tr("Вставьте ссылку на изображение", "Paste image URL")}
        />
      </div>
    </div>
  );
};

// --- Demo Data (Expanded) ---
const initialPosts = [
  {
    id: 10,
    author: 'Красивый футбол',
    group: 'Эстетика',
    avatar: 'https://picsum.photos/seed/beautiful_game/100/100',
    time: '45 минут назад',
    text: 'Просто наслаждайтесь этими кадрами. 14 фото.',
    images: [
      'https://picsum.photos/seed/goal_celebration/800/500',
      'https://picsum.photos/seed/overhead_kick/800/500',
      'https://picsum.photos/seed/stadium_sunset/500/500',
      'https://picsum.photos/seed/keeper_save/500/500',
      'https://picsum.photos/seed/team_huddle/500/500',
      'https://picsum.photos/seed/fans_lights/800/600',
      'https://picsum.photos/seed/football_art_1/800/600',
      'https://picsum.photos/seed/football_art_2/800/600',
      'https://picsum.photos/seed/football_art_3/800/600',
      'https://picsum.photos/seed/football_art_4/800/600',
      'https://picsum.photos/seed/football_art_5/800/600',
      'https://picsum.photos/seed/football_art_6/800/600',
      'https://picsum.photos/seed/football_art_7/800/600',
      'https://picsum.photos/seed/football_art_8/800/600',
    ],
    likes: 7650,
    commentsCount: 3,
    isLiked: false,
    comments: [{ id: 1, author: 'ArtLover', avatar: 'https://picsum.photos/seed/art/100/100', time: '20м', text: 'Вау, потрясающе!' }],
  },
  {
    id: 14,
    author: 'Old School Football',
    group: 'Легенды',
    avatar: 'https://picsum.photos/seed/oldschool/100/100',
    time: '1 час назад',
    text: 'Эпоха, когда футбол был другим. Меньше денег, больше души. #oldschool #football #legends',
    images: ['https://picsum.photos/seed/classic_match_1/800/600', 'https://picsum.photos/seed/classic_match_2/800/600', 'https://picsum.photos/seed/classic_match_3/800/600'],
    likes: 3200,
    commentsCount: 0,
    isLiked: false,
    comments: [],
  },
  {
    id: 13,
    author: 'Football Tactics Explained',
    group: 'Стратегии и ставки',
    avatar: 'https://picsum.photos/seed/tactics_master/100/100',
    time: '2 часа назад',
    text: 'Сегодня глубоко погружаемся в концепцию \'гегенпрессинга\', популяризированную Юргеном Клоппом. Это не просто бессмысленный бег, а высокоорганизованная система... (и далее по тексту)',
    images: ['https://picsum.photos/seed/gegenpress/800/600'],
    likes: 850,
    commentsCount: 5,
    isLiked: false,
    comments: [],
  },
  {
    id: 1,
    author: 'ФК "Зенит"',
    group: 'PRO Лига',
    avatar: 'https://picsum.photos/seed/zenit/100/100',
    time: '3 часа назад',
    text: 'Готовимся к следующему матчу! 💪⚽️ 5 фото с тренировки.',
    images: [
      'https://picsum.photos/seed/football_training_1/800/600',
      'https://picsum.photos/seed/football_training_2/800/600',
      'https://picsum.photos/seed/football_training_3/800/600',
      'https://picsum.photos/seed/football_action_1/800/600',
      'https://picsum.photos/seed/football_stadium_1/800/600',
    ],
    likes: 1256,
    commentsCount: 1,
    isLiked: false,
    comments: [{ id: 1, author: 'Иван Петров', avatar: 'https://picsum.photos/seed/user1/100/100', time: '1 час назад', text: 'Отличная работа, команда! Верим в победу!' }],
  },
  {
    id: 15,
    author: 'Footy News',
    group: 'PRO Лига',
    avatar: 'https://picsum.photos/seed/footynews/100/100',
    time: '4 часа назад',
    text: 'Невероятный камбэк в последнем матче! Кто смотрел?',
    images: ['https://picsum.photos/seed/comeback_1/800/500', 'https://picsum.photos/seed/comeback_2/800/500'],
    likes: 1800,
    commentsCount: 0,
    isLiked: false,
    comments: [],
  },
  {
    id: 4,
    author: 'Лига Чемпионов',
    group: 'PRO Лига',
    avatar: 'https://picsum.photos/seed/uefa/100/100',
    time: '5 часов назад',
    text: 'Лучшие моменты вчерашнего игрового дня. 4 фото.',
    images: ['https://picsum.photos/seed/champ_1/800/600', 'https://picsum.photos/seed/champ_2/800/600', 'https://picsum.photos/seed/champ_3/800/600', 'https://picsum.photos/seed/champ_4/800/600'],
    likes: 2100,
    commentsCount: 0,
    isLiked: false,
    comments: [],
  },
  {
    id: 16,
    author: 'Стадионы Мира',
    group: 'Эстетика',
    avatar: 'https://picsum.photos/seed/stadiums/100/100',
    time: '6 часов назад',
    text: 'Величие "Сантьяго Бернабеу".',
    images: ['https://picsum.photos/seed/bernabeu/800/550'],
    likes: 6700,
    commentsCount: 0,
    isLiked: false,
    comments: [],
  },
  {
    id: 5,
    author: 'Тактика',
    group: 'Стратегии и ставки',
    avatar: 'https://picsum.photos/seed/tactic_user/100/100',
    time: '7 часов назад',
    text: 'Разбираем схему 4-3-3 на конкретных примерах. 3 фото.',
    images: ['https://picsum.photos/seed/tactic_1/800/600', 'https://picsum.photos/seed/tactic_2/800/600', 'https://picsum.photos/seed/tactic_3/800/600'],
    likes: 600,
    commentsCount: 0,
    isLiked: false,
    comments: [],
  },
  {
    id: 6, author: 'Transfer News', group: 'Трансферы', avatar: 'https://picsum.photos/seed/transfer/100/100', time: '8 часов назад', text: 'Горячие слухи: кто перейдёт этим летом?', images: ['https://picsum.photos/seed/transfer_1/800/600', 'https://picsum.photos/seed/transfer_2/800/600'], likes: 4300, commentsCount: 2, isLiked: false, comments: [],
  },
  {
    id: 7, author: 'Фан-клуб', group: 'Болельщики', avatar: 'https://picsum.photos/seed/fanclub/100/100', time: '9 часов назад', text: 'Наш баннер на стадионе — лучший! Спасибо всем, кто помог!', images: ['https://picsum.photos/seed/banner_1/800/600', 'https://picsum.photos/seed/banner_2/800/600', 'https://picsum.photos/seed/banner_3/800/600', 'https://picsum.photos/seed/banner_4/800/600'], likes: 5100, commentsCount: 1, isLiked: false, comments: [],
  },
  {
    id: 8, author: 'Детская секция', group: 'Юниоры', avatar: 'https://picsum.photos/seed/junior/100/100', time: '10 часов назад', text: 'Наши юные таланты на тренировке. Будущие звёзды!', images: ['https://picsum.photos/seed/kids_1/800/600', 'https://picsum.photos/seed/kids_2/800/600'], likes: 890, commentsCount: 0, isLiked: false, comments: [],
  },
  {
    id: 9, author: 'Вратари мира', group: 'Эстетика', avatar: 'https://picsum.photos/seed/goalkeeper/100/100', time: '11 часов назад', text: 'Невероятные сейвы этой недели. Лучшие моменты.', images: ['https://picsum.photos/seed/save_1/800/600', 'https://picsum.photos/seed/save_2/800/600', 'https://picsum.photos/seed/save_3/800/600'], likes: 3200, commentsCount: 0, isLiked: false, comments: [],
  },
  {
    id: 17, author: 'Футбольная аналитика', group: 'Стратегии и ставки', avatar: 'https://picsum.photos/seed/analysis/100/100', time: '12 часов назад', text: 'Разбор матча: почему команда проиграла несмотря на 70% владения.', images: ['https://picsum.photos/seed/analysis_1/800/600', 'https://picsum.photos/seed/analysis_2/800/600', 'https://picsum.photos/seed/analysis_3/800/600', 'https://picsum.photos/seed/analysis_4/800/600'], likes: 1500, commentsCount: 0, isLiked: false, comments: [],
  },
  {
    id: 18, author: 'Женский футбол', group: 'PRO Лига', avatar: 'https://picsum.photos/seed/women/100/100', time: '13 часов назад', text: 'Женская сборная готовится к важному матчу. Поддержим наших!', images: ['https://picsum.photos/seed/women_1/800/600', 'https://picsum.photos/seed/women_2/800/600'], likes: 2100, commentsCount: 0, isLiked: false, comments: [],
  },
  {
    id: 19, author: 'Футбольная экипировка', group: 'Обзоры', avatar: 'https://picsum.photos/seed/kit/100/100', time: '14 часов назад', text: 'Обзор новых бутс этого сезона. Какая пара лучше?', images: ['https://picsum.photos/seed/boots_1/800/600', 'https://picsum.photos/seed/boots_2/800/600', 'https://picsum.photos/seed/boots_3/800/600'], likes: 980, commentsCount: 0, isLiked: false, comments: [],
  },
  {
    id: 20, author: 'Сборная мира', group: 'Легенды', avatar: 'https://picsum.photos/seed/world11/100/100', time: '15 часов назад', text: 'Ваш идеальный состав из действующих игроков. Делитесь в комментариях!', images: ['https://picsum.photos/seed/dream_team_1/800/600', 'https://picsum.photos/seed/dream_team_2/800/600', 'https://picsum.photos/seed/dream_team_3/800/600', 'https://picsum.photos/seed/dream_team_4/800/600', 'https://picsum.photos/seed/dream_team_5/800/600'], likes: 5400, commentsCount: 1, isLiked: false, comments: [],
  },
  {
    id: 21, author: 'Турнирная таблица', group: 'Обсуждение', avatar: 'https://picsum.photos/seed/standings/100/100', time: '16 часов назад', text: 'Обновлённая таблица чемпионата. Кто удивил, а кто разочаровал?', images: ['https://picsum.photos/seed/table_1/800/600'], likes: 780, commentsCount: 0, isLiked: false, comments: [],
  },
  {
    id: 22, author: 'Травмы и возвращения', group: 'Новости', avatar: 'https://picsum.photos/seed/injury/100/100', time: '17 часов назад', text: 'Ключевой игрок возвращается после травмы раньше срока.', images: ['https://picsum.photos/seed/return_1/800/600', 'https://picsum.photos/seed/return_2/800/600'], likes: 3400, commentsCount: 0, isLiked: false, comments: [],
  },
  {
    id: 23, author: 'Судьи', group: 'Обсуждение', avatar: 'https://picsum.photos/seed/referee/100/100', time: '18 часов назад', text: 'Обсуждаем спорные решения арбитров в прошедшем туре.', images: ['https://picsum.photos/seed/ref_1/800/600', 'https://picsum.photos/seed/ref_2/800/600', 'https://picsum.photos/seed/ref_3/800/600'], likes: 1200, commentsCount: 0, isLiked: false, comments: [],
  },
];

// --- Main Feed Component ---
export function FootballFeed() {
  const [posts, setPosts] = useState(initialPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>({});
  const [commentsOpen, setCommentsOpen] = useState<Set<number>>(new Set());
  const commentFileRefs = useRef<{ [key: number]: HTMLInputElement }>({});
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [newPostImageUrls, setNewPostImageUrls] = useState("");

  const toggleComments = (postId: number) => {
    setCommentsOpen(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleCommentImageSelect = (postId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 14).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setPosts(prev => prev.map(p =>
            p.id === postId
              ? { ...p, images: [reader.result as string, ...p.images] }
              : p
          ));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Fallbacks to avoid broken images if upstream (picsum) is blocked.
  const fallbackPool = useMemo(
    () => [
      "/demo/people/anna.png",
      "/demo/people/ivan.png",
      "/demo/people/maxim.png",
      "/demo/people/artem.png",
      "/demo/people/elena.png",
      "/demo/people/me.png",
    ],
    []
  );

  const normalizeUrl = useCallback(
    (url: string | undefined, fallbackIndex: number) => {
      if (!url) return fallbackPool[fallbackIndex % fallbackPool.length];
      if (url.startsWith("https://picsum.photos")) return fallbackPool[fallbackIndex % fallbackPool.length];
      return url;
    },
    [fallbackPool]
  );

  const normalizedPosts = useMemo(() => {
    return posts.map((post) => ({
      ...post,
      avatar: normalizeUrl(post.avatar, post.id),
      images: post.images.map((img, i) => normalizeUrl(img, i + post.id)),
      comments: post.comments.map((c, i) => ({
        ...c,
        avatar: normalizeUrl(c.avatar, i + post.id),
      })),
    }));
  }, [posts, normalizeUrl]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return normalizedPosts;
    return normalizedPosts.filter(
      (post) =>
        post.text.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query) ||
        post.group.toLowerCase().includes(query)
    );
  }, [searchQuery, normalizedPosts]);

  const POSTS_PER_PAGE = 15;
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const handleLike = useCallback((postId: number) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  }, []);

  const handleShare = useCallback(() => {
    // В шаблоне нет перевода ключей `filter.link_copied.*`, поэтому делаем RU/EN вручную.
    if (language === 'RU') {
      toast({
        title: 'Ссылка скопирована',
        description: 'Скопируйте ссылку и отправьте другу.',
      });
      return;
    }

    toast({
      title: 'Link copied',
      description: 'Copy the link and send it to a friend.',
    });
  }, [toast, language]);

  const handleCommentChange = (postId: number, text: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const handleCommentSubmit = (postId: number) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim()) return;

    if (containsForbiddenWords(commentText)) {
      toast({
        variant: 'destructive',
        title: t('filter.toast.title', { context: 'inappropriate' }),
        description: t('filter.toast.description', { context: 'inappropriate' }),
      });
      return;
    }

    if (isGibberish(commentText)) {
      toast({
        variant: 'destructive',
        title: t('filter.toast.title', { context: 'gibberish' }),
        description: t('filter.toast.gibberish_description', { context: 'gibberish' }),
      });
      return;
    }

    const tr = (ru: string, en: string) => (language === "RU" ? ru : en);
    const newComment: any = {
      id: Date.now(),
      author: tr("Вы", "You"),
      avatar: "/demo/people/me.png",
      time: tr("Только что", "Just now"),
      text: commentText,
    };

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment], commentsCount: post.commentsCount + 1 }
          : post
      )
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleCreatePost = () => {
    const urlImages = newPostImageUrls
      .split(',')
      .map((url) => url.trim())
      .filter((url) => url.startsWith('http'));
    const allImages = [...newPostImages, ...urlImages];

    if (!newPostText.trim() && allImages.length === 0) {
      toast({
        variant: "destructive",
        title: language === "RU" ? "Пустой пост" : "Empty post",
        description:
          language === "RU"
            ? "Добавьте текст или изображение."
            : "Add text or an image.",
      });
      return;
    }

    const newPost = {
      id: Date.now(),
      author: language === "RU" ? "Вы" : "You",
      group: 'PRO Лига',
      avatar: "/demo/people/me.png",
      time: language === "RU" ? "Только что" : "Just now",
      text: newPostText,
      images: allImages,
      likes: 0,
      commentsCount: 0,
      isLiked: false,
      comments: [],
    };

    setPosts((currentPosts) => [newPost, ...currentPosts]);

    setIsCreatePostOpen(false);
    setNewPostText("");
    setNewPostImages([]);
    setNewPostImageUrls("");

    toast({
      title: language === "RU" ? "Пост опубликован" : "Post published",
    });
  };

  return (
    <div className="bg-gray-100/30 font-sans">
      <div className="max-w-xl mx-auto py-4 px-3">
        <div className="flex gap-2 mb-4 px-1">
          <div className="relative flex-grow">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-11 bg-white border-gray-200/80 rounded-full shadow-sm text-sm font-medium focus:ring-2 focus:ring-blue-400 transition-all w-full"
              placeholder={language === "RU" ? "Поиск по постам..." : "Search posts..."}
            />
          </div>
          <Button
            onClick={() => setIsCreatePostOpen(true)}
            className="h-11 w-11 p-0 rounded-full bg-white border-gray-200/80 shadow-sm text-gray-500 hover:bg-gray-50 active:scale-95"
          >
            <PlusCircle size={20} />
          </Button>
        </div>

        {paginatedPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-xl shadow-sm mb-5 border border-gray-200/80 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                  <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                    {post.author} <span className="font-medium text-gray-400">·</span>{" "}
                    <span className="font-medium text-blue-500 text-xs">{post.group}</span>
                  </p>
                  <p className="text-gray-500 text-xs font-medium">{post.time}</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={20} />
              </button>
            </div>

            <PostText text={post.text} />

            <PostImageGallery images={post.images} />

            <div className="px-5 py-2 flex justify-between items-center border-t border-gray-100 mt-3">
              <div className="flex items-center gap-5">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors font-semibold text-sm py-2 group"
                >
                  <Heart
                    size={20}
                    className={`transition-all ${post.isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400 group-hover:text-red-500/70'}`}
                  />
                  <span className={post.isLiked ? 'text-red-500' : 'text-gray-500'}>{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors font-semibold text-sm py-2">
                  <MessageCircle size={20} className="text-gray-400" />
                  <span>{post.commentsCount}</span>
                </button>
              </div>
              <button onClick={handleShare} className="text-gray-400 hover:text-gray-800 py-2">
                <Share2 size={20} />
              </button>
            </div>

            <div className="border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => toggleComments(post.id)}
                className="w-full flex items-center justify-between px-5 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span className="flex items-center gap-2 font-semibold text-sm">
                  <MessageCircle size={16} className="text-gray-400" />
                  {language === "RU" ? "Комментарии" : "Comments"} ({post.commentsCount})
                </span>
                <ChevronDown
                  size={16}
                  className={cn(
                    "transition-transform duration-200",
                    commentsOpen.has(post.id) && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {commentsOpen.has(post.id) && (
                  <motion.div
                    key="comments"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4">
                      {post.comments.map((comment: any) => (
                        <div key={comment.id} className="flex items-start gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden mt-1 flex-shrink-0">
                            <img src={comment.avatar} alt={comment.author} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 bg-gray-100 rounded-xl px-3 py-2">
                            <div className="flex items-baseline gap-2">
                              <p className="font-bold text-xs text-gray-800">{comment.author}</p>
                              <p className="text-gray-400 text-[10px]">{comment.time}</p>
                            </div>
                            {comment.text && <p className="text-sm text-gray-700 mt-1">{comment.text}</p>}
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center gap-3 mt-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 font-bold text-white flex items-center justify-center text-sm flex-shrink-0">
                          ME
                        </div>
                        <div className="flex-1 relative flex items-center gap-2 bg-gray-100 rounded-full px-3">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => handleCommentChange(post.id, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                            placeholder={language === "RU" ? "Напишите комментарий..." : "Write a comment..."}
                            className="flex-1 bg-transparent py-2 text-sm focus:outline-none min-w-0"
                          />
                          <button
                            type="button"
                            onClick={() => commentFileRefs.current[post.id]?.click()}
                            className="text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
                          >
                            <Image size={18} />
                          </button>
                          <button
                            onClick={() => handleCommentSubmit(post.id)}
                            className="text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
                          >
                            <Send size={18} />
                          </button>
                          <input
                            type="file"
                            ref={el => { commentFileRefs.current[post.id] = el!; }}
                            onChange={(e) => handleCommentImageSelect(post.id, e)}
                            className="hidden"
                            accept="image/png, image/jpeg, image/gif, image/webp"
                            multiple
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {totalPages > 1 && (
          <Pagination className="mb-4">
            <PaginationContent>
              <PaginationItem>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => (
                <PaginationItem key={i + 1}>
                  <Button variant={currentPage === i + 1 ? "default" : "outline"} size="icon" className="h-9 w-9" onClick={() => setCurrentPage(i + 1)}>
                    {i + 1}
                  </Button>
                </PaginationItem>
              ))}
              <PaginationItem>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <Toaster />
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 border-0 app-shadow">
          <DialogHeader>
            <DialogTitle className="font-black tracking-tight text-xl">
              {language === "RU" ? "Создать пост" : "Create post"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium pt-1">
              {language === "RU"
                ? "Опубликуйте новый пост в ленте «Футбол»."
                : "Publish a new post in the «Football» feed."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="post-text" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
                {language === "RU" ? "Текст поста" : "Post text"}
              </Label>
              <Textarea
                id="post-text"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="rounded-xl bg-muted/50 border-0 min-h-[80px]"
                placeholder={language === "RU" ? "Напишите что-нибудь..." : "Write something..."}
              />
            </div>
            <PostImageUploader
              images={newPostImages}
              setImages={setNewPostImages}
              newPostImageUrls={newPostImageUrls}
              setNewPostImageUrls={setNewPostImageUrls}
            />
          </div>

          <DialogFooter className="pt-6">
            <Button
              onClick={handleCreatePost}
              className="w-full h-12 rounded-xl gradient-bg text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 border-0"
            >
              {language === "RU" ? "Опубликовать" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

