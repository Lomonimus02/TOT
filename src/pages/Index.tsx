
import { Suspense } from 'react';
import Scene from '../components/Scene';
import StarBackground from '../components/StarBackground';
import InfoPanel from '../components/InfoPanel';
import SideMenu from '../components/SideMenu';

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
      
      {/* Информационная панель */}
      <InfoPanel />
      
      {/* Заголовок над пирамидой */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-40">
        <h1 className="text-2xl md:text-4xl font-bold text-yellow-400 tracking-widest text-center shadow-2xl">
          ПИРАМИДА ТОТА. КОМПЛЕКС ТОТ-МААТ
        </h1>
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
