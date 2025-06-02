
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

const Pyramid = () => {
  const meshRef = useRef<Mesh>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current && !isInteracting) {
      // Только небольшое покачивание, без автоматического вращения
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      castShadow 
      receiveShadow
      onPointerDown={() => setIsInteracting(true)}
      onPointerUp={() => setIsInteracting(false)}
      onPointerLeave={() => setIsInteracting(false)}
    >
      {/* Используем цилиндр с 4 сегментами для создания пирамиды */}
      <cylinderGeometry args={[0, 3, 4, 4]} />
      <meshStandardMaterial 
        color="#d4af37"
        metalness={0.1}
        roughness={0.8}
        emissive="#2d1810"
        emissiveIntensity={0.05}
      />
    </mesh>
  );
};

export default Pyramid;
