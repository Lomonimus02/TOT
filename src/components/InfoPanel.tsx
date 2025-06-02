
const InfoPanel = () => {
  return (
    <div className="absolute top-8 left-8 text-white z-10">
      <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
        Космическая Пирамида
      </h1>
      <p className="text-lg opacity-80 mb-4">
        Интерактивная 3D пирамида среди звезд
      </p>
      <div className="text-sm opacity-60 space-y-1">
        <p>🖱️ Зажмите и перетащите для вращения</p>
        <p>🔄 Прокрутите для приближения</p>
        <p>✨ Наслаждайтесь космическим видом</p>
      </div>
    </div>
  );
};

export default InfoPanel;
