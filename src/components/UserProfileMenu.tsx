
import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  username: string;
  full_name: string;
}

const UserProfileMenu = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем текущего пользователя
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Загружаем профиль пользователя
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }
      }
    };

    getCurrentUser();

    // Слушаем изменения состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('id', session.user.id)
            .single();
          
          if (profileData) {
            setProfile(profileData);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleProfileClick = () => {
    // Пока не функциональная кнопка
    console.log('Переход в профиль');
  };

  const handleAuthClick = () => {
    navigate('/auth');
  };

  if (!user) {
    // Показываем серую аватарку для неавторизованных пользователей
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={handleAuthClick}
          variant="ghost"
          className="p-2 bg-black/20 border-white/20 text-white hover:bg-white/10"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gray-500 text-white">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="p-2 bg-black/20 border-white/20 text-white hover:bg-white/10 flex items-center gap-2"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-yellow-600 text-white font-semibold">
                {profile?.username ? profile.username.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {profile?.username || 'Пользователь'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-black/90 border-white/20 text-white"
        >
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium text-yellow-400">
              {profile?.full_name || profile?.username}
            </p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          
          <DropdownMenuSeparator className="bg-white/20" />
          
          <DropdownMenuItem 
            onClick={handleProfileClick}
            className="text-white hover:bg-white/10 cursor-pointer"
          >
            Профиль
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-white/20" />
          
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="text-red-400 hover:bg-white/10 cursor-pointer"
          >
            Выход
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserProfileMenu;
