
import { useState } from 'react';
import { Edit, Trash2, Eye, EyeOff, Image, Video } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

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
}

interface BlockContent {
  text?: string;
  media?: MediaItem[];
}

interface ScheduleBlockCardProps {
  block: ScheduleBlock;
  isAdmin: boolean;
  onEdit: (block: ScheduleBlock) => void;
  onUpdate: () => void;
}

const ScheduleBlockCard = ({ block, isAdmin, onEdit, onUpdate }: ScheduleBlockCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Парсим контент блока
  const parseContent = (content: string | null): BlockContent => {
    if (!content) return { text: '', media: [] };
    
    try {
      const parsed = JSON.parse(content);
      return {
        text: parsed.text || '',
        media: parsed.media || []
      };
    } catch {
      // Если контент не в JSON формате, возвращаем как текст
      return { text: content, media: [] };
    }
  };

  const contentData = parseContent(block.content);

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот блок?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('schedule_blocks')
        .delete()
        .eq('id', block.id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Блок удален",
      });

      onUpdate();
    } catch (error) {
      console.error('Error deleting block:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить блок",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleVisibility = async () => {
    try {
      const { error } = await supabase
        .from('schedule_blocks')
        .update({ 
          is_visible: !block.is_visible,
          updated_at: new Date().toISOString()
        })
        .eq('id', block.id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `Блок ${!block.is_visible ? 'показан' : 'скрыт'}`,
      });

      onUpdate();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить видимость",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white text-xl">{block.title}</CardTitle>
        {isAdmin && (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVisibility}
              className="text-white hover:bg-gray-700"
              title={block.is_visible ? 'Скрыть блок' : 'Показать блок'}
            >
              {block.is_visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(block)}
              className="text-white hover:bg-gray-700"
              title="Редактировать"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-400 hover:bg-red-900/20"
              title="Удалить"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="text-white space-y-4">
        {/* Текстовое содержимое */}
        {contentData.text && (
          <div className="whitespace-pre-wrap text-gray-200">
            {contentData.text}
          </div>
        )}

        {/* Медиа содержимое */}
        {contentData.media && contentData.media.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentData.media.map((item, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden">
                {item.type === 'image' ? (
                  <div className="group relative">
                    <img
                      src={item.url}
                      alt={`Изображение ${index + 1}`}
                      className="w-full aspect-video object-cover rounded-lg"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 bg-black/50 rounded p-1">
                      <Image className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <video
                      src={item.url}
                      controls
                      className="w-full aspect-video object-cover rounded-lg"
                      preload="metadata"
                    >
                      Ваш браузер не поддерживает воспроизведение видео.
                    </video>
                    <div className="absolute top-2 left-2 bg-black/50 rounded p-1">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Индикатор видимости для администраторов */}
        {isAdmin && !block.is_visible && (
          <div className="text-yellow-400 text-sm font-medium">
            ⚠️ Этот блок скрыт от пользователей
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduleBlockCard;
