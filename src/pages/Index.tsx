
import { Suspense } from 'react';
import Scene from '../components/Scene';
import StarBackground from '../components/StarBackground';
import InfoPanel from '../components/InfoPanel';
import SideMenu from '../components/SideMenu';
import UserProfileMenu from '../components/UserProfileMenu';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen text-white">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
      <p className="text-xl">Загрузка космической пирамиды...</p>
    </div>
  </div>
);

const Index = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Фон со звездами */}
      <StarBackground />
      
      {/* Боковое меню */}
      <SideMenu />
      
      {/* Меню профиля пользователя */}
      <UserProfileMenu />
      
      {/* Информационная панель */}
      <InfoPanel />
      
      {/* Заголовок и символы над пирамидой */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-40 text-center">
        {/* Главный заголовок */}
        <h1 className="text-xl md:text-3xl font-bold text-yellow-300 tracking-[0.3em] mb-4 drop-shadow-2xl">
          ПИРАМИДА ТОТА
        </h1>
        <h2 className="text-lg md:text-2xl font-semibold text-yellow-200 tracking-[0.2em] mb-6 drop-shadow-xl">
          КОМПЛЕКС ТОТ-МААТ
        </h2>
        
        {/* Символы */}
        <div className="flex justify-center items-center space-x-4 md:space-x-8 text-yellow-300">
          {/* Анкх */}
          <div className="text-2xl md:text-4xl font-bold drop-shadow-lg">☥</div>
          
          {/* Глаз Гора */}
          <div className="text-2xl md:text-4xl drop-shadow-lg">𓂀</div>
          
          {/* Скарабей */}
          <div className="text-2xl md:text-4xl drop-shadow-lg">𓆣</div>
          
          {/* Пирамида */}
          <div className="text-2xl md:text-4xl drop-shadow-lg">⏃</div>
          
          {/* Солнце */}
          <div className="text-2xl md:text-4xl drop-shadow-lg">☉</div>
        </div>
      </div>
      
      {/* 3D сцена */}
      <Suspense fallback={<LoadingSpinner />}>
        <Scene />
      </Suspense>
      
      {/* Градиентная подсветка по краям */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
      </div>
    </div>
  );
};

export default Index;
