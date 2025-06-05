
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface ScheduleBlockFormProps {
  block?: ScheduleBlock | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ScheduleBlockForm = ({ block, onClose, onSuccess }: ScheduleBlockFormProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [position, setPosition] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setContent(block.content || '');
      setPosition(block.position);
      setIsVisible(block.is_visible);
    } else {
      // Для нового блока получаем следующую позицию
      getNextPosition();
    }
  }, [block]);

  const getNextPosition = async () => {
    try {
      const { data, error } = await supabase
        .from('schedule_blocks')
        .select('position')
        .order('position', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      const maxPosition = data && data.length > 0 ? data[0].position : 0;
      setPosition(maxPosition + 1);
    } catch (error) {
      console.error('Error getting next position:', error);
      setPosition(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Ошибка",
        description: "Заголовок обязателен для заполнения",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (block) {
        // Обновляем существующий блок
        const { error } = await supabase
          .from('schedule_blocks')
          .update({
            title: title.trim(),
            content: content.trim() || null,
            position,
            is_visible: isVisible,
            updated_at: new Date().toISOString(),
          })
          .eq('id', block.id);

        if (error) throw error;

        toast({
          title: "Блок обновлен",
          description: "Блок расписания успешно обновлен",
        });
      } else {
        // Создаем новый блок
        const { error } = await supabase
          .from('schedule_blocks')
          .insert({
            title: title.trim(),
            content: content.trim() || null,
            position,
            is_visible: isVisible,
          });

        if (error) throw error;

        toast({
          title: "Блок создан",
          description: "Новый блок расписания успешно создан",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving block:', error);
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить блок",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-black/90 border-white/20 text-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-yellow-300">
              {block ? 'Редактировать блок' : 'Создать блок'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Заголовок *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите заголовок блока"
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Содержание
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Введите содержание блока"
                rows={6}
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Позиция
                </label>
                <Input
                  type="number"
                  value={position}
                  onChange={(e) => setPosition(Number(e.target.value))}
                  min="0"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Видимость
                </label>
                <select
                  value={isVisible.toString()}
                  onChange={(e) => setIsVisible(e.target.value === 'true')}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-md text-white"
                >
                  <option value="true">Видимый</option>
                  <option value="false">Скрытый</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
              >
                {isSaving ? 'Сохранение...' : (block ? 'Обновить' : 'Создать')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleBlockForm;
