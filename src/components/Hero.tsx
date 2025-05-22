import { motion } from 'framer-motion';
import { FaLinkedin, FaGithub } from 'react-icons/fa';

const Hero = () => {
  return (
    <section id="home" className="section min-h-screen flex items-center bg-gradient-to-b from-[var(--primary)]/10 to-[var(--secondary)]/10">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Hi, I'm{' '}
              <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
                Prabin Parajuli
              </span>
            </h1>
            <h2 className="text-2xl sm:text-3xl text-gray-600 dark:text-gray-300 mb-6">
              Full Stack Developer
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
              Crafting modern, responsive, and scalable web applications with a focus on the MERN stack and cutting-edge technologies.
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.a
                href="/cv.pdf"
                className="btn btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Download CV
              </motion.a>
              <div className="flex gap-4">
                <motion.a
                  href="https://www.linkedin.com/in/prabin-parajuli-techie496/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xl text-gray-600 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--primary)] transition-colors"
                  whileHover={{ scale: 1.1 }}
                >
                  <FaLinkedin />
                </motion.a>
                <motion.a
                  href="https://github.com/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xl text-gray-600 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--primary)] transition-colors"
                  whileHover={{ scale: 1.1 }}
                >
                  <FaGithub />
                </motion.a>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="w-80 h-80 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] opacity-30 blur-3xl absolute -top-12 -left-12"></div>
              <div className="w-80 h-80 rounded-full bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)] opacity-30 blur-3xl absolute -bottom-12 -right-12"></div>
              <div className="relative z-10 glass p-10 rounded-3xl">
                <div className="aspect-square rounded-xl bg-gradient-to-br from-[var(--primary)]/30 to-[var(--secondary)]/30"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;