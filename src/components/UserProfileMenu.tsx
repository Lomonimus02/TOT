
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const navigate = useNavigate();

  const loadUserProfile = async (userId: string) => {
    setIsProfileLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', userId)
        .maybeSingle();
      
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Устанавливаем слушатель изменений состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await loadUserProfile(currentUser.id);
        } else {
          setProfile(null);
        }
        
        // Убираем загрузку после обработки события
        setIsInitialLoading(false);
      }
    );

    // Проверяем существующую сессию
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            await loadUserProfile(currentUser.id);
          }
          
          setIsInitialLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setIsInitialLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileClick = () => {
    console.log('Переход в профиль');
  };

  const handleAuthClick = () => {
    navigate('/auth');
  };

  // Показываем загрузку только в самом начале
  if (isInitialLoading) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          className="p-2 bg-black/20 border-white/20 text-white"
          disabled
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

  if (!user) {
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
            disabled={isProfileLoading}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-yellow-600 text-white font-semibold">
                {profile?.username ? profile.username.charAt(0).toUpperCase() : (user.email?.charAt(0).toUpperCase() || 'U')}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {isProfileLoading ? 'Загрузка...' : (profile?.username || user.email?.split('@')[0] || 'Пользователь')}
            </span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-black/90 border-white/20 text-white"
        >
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium text-yellow-400">
              {profile?.full_name || profile?.username || user.email?.split('@')[0]}
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
