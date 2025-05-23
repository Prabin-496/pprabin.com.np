import React from 'react';
import { motion } from 'framer-motion';

// Footer Component
const Footer = () => (
  <footer className="py-12 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent dark:from-gray-900/80"></div>
    <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="inline-block mb-6 p-4 bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-white/20"
          whileHover={{ scale: 1.05, rotate: 5 }}
        >
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            PP
          </span>
        </motion.div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Crafting digital experiences that make a difference
        </p>
        <motion.p
          className="text-sm text-gray-500 dark:text-gray-500"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          © 2025 Prabin Parajuli. All rights reserved. Built with ❤️ and modern tech.
        </motion.p>
      </motion.div>
    </div>
  </footer>
);

export default Footer;