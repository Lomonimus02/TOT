
const StarBackground = () => {
  return (
    <div 
      className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2126&q=80')",
        zIndex: -1
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-pink-900/20"></div>
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
    </div>
  );
};

export default StarBackground;
