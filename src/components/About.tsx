import React from 'react';
import { motion } from 'framer-motion';

// About Component
const About = () => {
  const skills = [
    { name: 'React', level: 95, icon: '⚛️' },
    { name: 'TypeScript', level: 90, icon: '📘' },
    { name: 'Node.js', level: 88, icon: '💚' },
    { name: 'MongoDB', level: 85, icon: '🍃' },
    { name: 'Express', level: 87, icon: '🚀' },
    { name: 'Tailwind CSS', level: 92, icon: '🎨' },
    { name: 'Docker', level: 80, icon: '🐳' },
    { name: 'Git', level: 88, icon: '📚' },
    { name: 'Video Editing', level:60, icon: '🎨' },
  ];

  return (
    <section id="about" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent dark:via-gray-900/30"></div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-20">
            <motion.h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                About Me
              </span>
            </motion.h2>
            <motion.div
              className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="prose prose-lg dark:prose-invert">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                  I'm a passionate BSc (Hons) Computing graduate from London Metropolitan University with a deep love for creating innovative web solutions. My journey in tech began with curiosity and evolved into expertise in full-stack development.
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                  I specialize in the MERN stack and modern web technologies, focusing on building scalable, user-centric applications that solve real-world problems. Every project is an opportunity to push boundaries and deliver exceptional user experiences.
                </p>
              </div>

              <motion.div
                className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                  🎓 Education
                </h3>
                <div className="space-y-2">
                  <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    BSc (Hons) Computing
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    London Metropolitan University
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Graduated with honors, specializing in software development and modern web technologies
                  </p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-2xl font-bold mb-8 text-gray-800 dark:text-gray-200">
                🚀 Technical Skills
              </h3>
              <div className="space-y-6">
                {skills.map((skill, index) => (
                  <motion.div
                    key={skill.name}
                    className="group"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{skill.icon}</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {skill.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;