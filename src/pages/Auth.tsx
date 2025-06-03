
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from '@supabase/supabase-js';
import StarBackground from '@/components/StarBackground';
import SideMenu from '@/components/SideMenu';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Устанавливаем слушатель изменений состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          navigate('/');
        }
      }
    );

    // Проверяем существующую сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Ошибка входа",
            description: "Неверный email или пароль",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Ошибка входа",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Успешный вход",
          description: "Добро пожаловать!",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла неожиданная ошибка",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Ошибка",
        description: "Ошибка при выходе из аккаунта",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Выход выполнен",
        description: "До свидания!",
      });
    }
  };

  if (user) {
    return (
      <div className="min-h-screen relative">
        <StarBackground />
        <SideMenu />
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-md mx-auto">
            <Card className="bg-black/80 border-white/20 text-white">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-yellow-400 mb-2">
                  Добро пожаловать!
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Вы успешно вошли в систему
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-center text-gray-300">
                  Email: {user.email}
                </p>
                <Button
                  onClick={handleSignOut}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Выйти
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  На главную
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <StarBackground />
      <SideMenu />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-md mx-auto">
          <Card className="bg-black/80 border-white/20 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-yellow-400 mb-2">
                Вход в систему
              </CardTitle>
              <CardDescription className="text-gray-300">
                Войдите в свой аккаунт
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="Введите email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Пароль
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="Введите пароль"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
                >
                  {isLoading ? "Вход..." : "Войти"}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate('/forum-registration')}
                    className="text-yellow-400 hover:text-yellow-300"
                  >
                    Нет аккаунта? Зарегистрироваться
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
