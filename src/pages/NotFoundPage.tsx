import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4 bg-ocean text-white text-center">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-9xl mb-8"
      >
        🏄‍♂️
      </motion.div>
      <h1 className="text-6xl font-black mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-8">Vixe! Essa onda você dropou errado...</h2>
      <p className="text-ocean-light max-w-md mb-12">
        A página que você está procurando não existe ou foi movida para outro pico. 
        Que tal voltar para o mapa e encontrar o rolê certo?
      </p>
      <Link 
        to="/" 
        className="bg-surf text-white px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-black/20"
      >
        Voltar para o Mapa 🗺️
      </Link>
    </div>
  );
};
export default NotFoundPage;
