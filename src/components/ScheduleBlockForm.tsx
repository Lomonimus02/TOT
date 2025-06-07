
import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import MediaUpload from './MediaUpload';

interface ScheduleBlock {
  id: string;
  title: string;
  content: string | null;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  file?: File;
}

interface ScheduleBlockFormProps {
  block: ScheduleBlock | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ScheduleBlockForm = ({ block, onClose, onSuccess }: ScheduleBlockFormProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setContent(block.content || '');
      setIsVisible(block.is_visible);
      
      // Парсим медиа контент из существующего содержимого
      try {
        if (block.content) {
          const parsedContent = JSON.parse(block.content);
          if (parsedContent.media) {
            setMediaItems(parsedContent.media);
          }
          if (parsedContent.text) {
            setContent(parsedContent.text);
          }
        }
      } catch {
        // Если контент не в JSON формате, используем как обычный текст
        setContent(block.content || '');
      }
    }
  }, [block]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Ошибка",
        description: "Заголовок не может быть пустым",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Пользователь не аутентифицирован');
      }

      // Формируем контент с медиа и текстом
      const contentData = {
        text: content,
        media: mediaItems.map(item => ({
          type: item.type,
          url: item.url // В реальном приложении здесь должны быть загруженные URL
        }))
      };

      const blockData = {
        title: title.trim(),
        content: JSON.stringify(contentData),
        is_visible: isVisible,
        created_by: user.id,
      };

      if (block) {
        // Обновляем существующий блок
        const { error } = await supabase
          .from('schedule_blocks')
          .update({
            ...blockData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', block.id);

        if (error) throw error;

        toast({
          title: "Успешно",
          description: "Блок обновлен",
        });
      } else {
        // Создаем новый блок
        const { data: existingBlocks } = await supabase
          .from('schedule_blocks')
          .select('position')
          .order('position', { ascending: false })
          .limit(1);

        const newPosition = existingBlocks && existingBlocks.length > 0 
          ? existingBlocks[0].position + 1 
          : 0;

        const { error } = await supabase
          .from('schedule_blocks')
          .insert({
            ...blockData,
            position: newPosition,
          });

        if (error) throw error;

        toast({
          title: "Успешно",
          description: "Блок создан",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving block:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить блок",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaAdd = (media: MediaItem[]) => {
    setMediaItems(media);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">
            {block ? 'Редактировать блок' : 'Создать блок'}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                Заголовок
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите заголовок блока"
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-white mb-2">
                Текстовое содержимое
              </label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Введите содержимое блока"
                rows={6}
                className="bg-gray-800 border-gray-600 text-white resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Медиа файлы
              </label>
              <MediaUpload onMediaAdd={handleMediaAdd} />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isVisible"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800"
              />
              <label htmlFor="isVisible" className="text-sm text-white">
                Видимый для пользователей
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-white border-gray-600 hover:bg-gray-700"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-yellow-600 hover:bg-yellow-700 text-black"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleBlockForm;
