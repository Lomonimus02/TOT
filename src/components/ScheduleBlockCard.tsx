
import { useState } from 'react';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
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

interface ScheduleBlockCardProps {
  block: ScheduleBlock;
  isAdmin: boolean;
  onEdit: (block: ScheduleBlock) => void;
  onUpdate: () => void;
}

const ScheduleBlockCard = ({ block, isAdmin, onEdit, onUpdate }: ScheduleBlockCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

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
        title: "Блок удален",
        description: "Блок расписания успешно удален",
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error deleting block:', error);
      toast({
        title: "Ошибка удаления",
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
        .update({ is_visible: !block.is_visible })
        .eq('id', block.id);

      if (error) throw error;

      toast({
        title: "Видимость изменена",
        description: `Блок ${block.is_visible ? 'скрыт' : 'показан'}`,
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить видимость блока",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`bg-black/60 border-white/20 text-white ${!block.is_visible && isAdmin ? 'opacity-50' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-yellow-300 text-xl font-bold">
            {block.title}
            {!block.is_visible && isAdmin && (
              <span className="ml-2 text-sm text-gray-400">(скрыто)</span>
            )}
          </CardTitle>
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVisibility}
                className="text-white hover:bg-white/10"
              >
                {block.is_visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(block)}
                className="text-white hover:bg-white/10"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-400 hover:bg-red-400/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      {block.content && (
        <CardContent>
          <div className="text-white/90 whitespace-pre-wrap">
            {block.content}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ScheduleBlockCard;
