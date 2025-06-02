
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

const Pyramid = () => {
  const meshRef = useRef<Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Автоматическое медленное вращение
      meshRef.current.rotation.y += 0.005;
      // Небольшое покачивание
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <coneGeometry args={[2, 3, 4]} />
      <meshStandardMaterial 
        color="#ffd700"
        metalness={0.8}
        roughness={0.2}
        emissive="#442200"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
};

export default Pyramid;
