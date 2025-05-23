import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full backdrop-blur-sm border border-white/20 mb-8"
            >
              <span className="text-sm font-medium bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                ✨ Available for new opportunities
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Hi, I'm{' '}
              <motion.span
                className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent relative"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{ backgroundSize: '200% 200%' }}
              >
                Prabin
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-lg blur opacity-30"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.span>
            </motion.h1>

            <motion.h2
              className="text-2xl sm:text-3xl lg:text-4xl text-gray-600 dark:text-gray-300 mb-8 font-light"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Full Stack Developer & Tech Innovator
            </motion.h2>

            <motion.p
              className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              Crafting exceptional digital experiences with modern technologies. Specialized in MERN stack development, creating scalable web applications that make a difference.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-6 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <motion.a
                href="#projects"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold shadow-2xl overflow-hidden"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">View My Work</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>

              <motion.a
                href="/cv.pdf"
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-2xl text-gray-700 dark:text-gray-300 font-semibold hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 backdrop-blur-sm"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Download CV
              </motion.a>
            </motion.div>

            <motion.div
              className="flex justify-center lg:justify-start gap-6 mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              {[
                { href: "https://www.linkedin.com/in/prabin-parajuli-techie496/", icon: "💼", label: "LinkedIn" },
                { href: "https://github.com/prabin_496", icon: "🔗", label: "GitHub" },
                { href: "https://www.instagram.com/prabin_496/", icon: "📸", label: "Instagram" }
              ].map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-2xl bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-2xl hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all duration-300"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                >
                  {social.icon}
                </motion.a>
              ))}
            </motion.div>
          </motion.div>

          {/* 3D Hero Visual */}
          <motion.div
            className="hidden lg:block relative"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <div className="relative w-full h-96">
              {/* 3D Card Stack */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotateY: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    className="absolute inset-0 rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl"
                    style={{
                      background: `linear-gradient(135deg, 
                        rgba(59, 130, 246, ${0.1 + index * 0.05}) 0%, 
                        rgba(147, 51, 234, ${0.1 + index * 0.05}) 50%, 
                        rgba(236, 72, 153, ${0.1 + index * 0.05}) 100%)`,
                      transform: `translateZ(${index * 20}px) rotateY(${index * 2}deg)`
                    }}
                    animate={{
                      rotateX: [0, 2, 0],
                      rotateY: [index * 2, index * 2 + 3, index * 2],
                    }}
                    transition={{
                      duration: 4 + index,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.5
                    }}
                  >
                    <div className="p-8 h-full flex flex-col justify-center">
                      <div className="space-y-4">
                        <div className="h-4 bg-gradient-to-r from-blue-400/50 to-purple-500/50 rounded-full"></div>
                        <div className="h-3 bg-gradient-to-r from-purple-400/40 to-pink-500/40 rounded-full w-3/4"></div>
                        <div className="h-3 bg-gradient-to-r from-blue-400/30 to-purple-500/30 rounded-full w-1/2"></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Floating elements around the 3D cards */}
              <motion.div
                className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                animate={{ y: [-10, 10, -10], rotate: [0, 180, 360] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                animate={{ y: [10, -10, 10], rotate: [360, 180, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;