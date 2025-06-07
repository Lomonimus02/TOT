
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import StarBackground from '../components/StarBackground';
import SideMenu from '../components/SideMenu';
import UserProfileMenu from '../components/UserProfileMenu';
import ScheduleBlockForm from '../components/ScheduleBlockForm';
import ScheduleBlockCard from '../components/ScheduleBlockCard';
import { Button } from "@/components/ui/button";
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

const Description = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Проверяем текущего пользователя
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Проверяем роль администратора
          const { data: roleData } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: 'admin'
          });
          setIsAdmin(roleData || false);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };

    getCurrentUser();

    // Слушаем изменения состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const { data: roleData } = await supabase.rpc('has_role', {
              _user_id: session.user.id,
              _role: 'admin'
            });
            setIsAdmin(roleData || false);
          } catch (error) {
            console.error('Error checking admin role:', error);
          }
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadScheduleBlocks();
  }, []);

  const loadScheduleBlocks = async () => {
    try {
      const { data, error } = await supabase
        .from('schedule_blocks')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setScheduleBlocks(data || []);
    } catch (error) {
      console.error('Error loading schedule blocks:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить блоки описания",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBlock = () => {
    setEditingBlock(null);
    setShowForm(true);
  };

  const handleEditBlock = (block: ScheduleBlock) => {
    setEditingBlock(block);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingBlock(null);
  };

  const handleFormSuccess = () => {
    loadScheduleBlocks();
    handleFormClose();
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black">
        <StarBackground />
        <SideMenu />
        <UserProfileMenu />
        <div className="flex items-center justify-center h-screen text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-xl">Загрузка описания...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-black">
      {/* Фон со звездами */}
      <StarBackground />
      
      {/* Боковое меню */}
      <SideMenu />
      
      {/* Меню профиля пользователя */}
      <UserProfileMenu />
      
      {/* Основной контент */}
      <div className="relative z-30 pt-20 pb-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold text-yellow-300 tracking-[0.3em] mb-4 drop-shadow-2xl">
              ОПИСАНИЕ
            </h1>
            <h2 className="text-xl md:text-2xl font-semibold text-yellow-200 tracking-[0.2em] drop-shadow-xl">
              КОМПЛЕКС ТОТ-МААТ
            </h2>
          </div>

          {/* Кнопка добавления блока для администраторов */}
          {isAdmin && (
            <div className="mb-8 text-center">
              <Button
                onClick={handleCreateBlock}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить блок
              </Button>
            </div>
          )}

          {/* Блоки описания */}
          <div className="space-y-6">
            {scheduleBlocks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/70 text-lg">
                  {isAdmin ? "Создайте первый блок описания" : "Описание пока не добавлено"}
                </p>
              </div>
            ) : (
              scheduleBlocks.map((block) => (
                <ScheduleBlockCard
                  key={block.id}
                  block={block}
                  isAdmin={isAdmin}
                  onEdit={handleEditBlock}
                  onUpdate={loadScheduleBlocks}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Форма создания/редактирования блока */}
      {showForm && (
        <ScheduleBlockForm
          block={editingBlock}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Градиентная подсветка по краям */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
      </div>
    </div>
  );
};

export default Description;
