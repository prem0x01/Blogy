import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BlogList from '../components/BlogList';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for hero section
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[70vh] flex items-center justify-center
          bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="text-center px-4 space-y-6 max-w-2xl mx-auto">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-4xl md:text-5xl font-light text-gray-900
              transition-all duration-300 ${scrolled ? 'opacity-0' : ''}`}
          >
            Stories that inspire.
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-gray-600 md:text-lg font-light
              transition-all duration-300 ${scrolled ? 'opacity-0' : ''}`}
          >
            Discover thoughtful writing from independent voices.
          </motion.p>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`absolute bottom-8 left-1/2 transform -translate-x-1/2
            transition-all duration-300 ${scrolled ? 'opacity-0' : ''}`}
        >
          <div className="w-[1px] h-12 bg-gradient-to-b from-gray-300 to-transparent"/>
        </motion.div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent 
          to-white pointer-events-none"/>
      </motion.section>

      {/* Blog List Section */}
      <section className="py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <BlogList />
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-sm text-gray-500">
        <div className="max-w-5xl mx-auto px-4">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent 
            via-gray-200 to-transparent mb-8"/>
          <p>© {new Date().getFullYear()} Blogy. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}