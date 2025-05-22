import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  const skills = [
    'React',
    'TypeScript',
    'Node.js',
    'Express',
    'MongoDB',
    'Tailwind CSS',
    'Git',
    'Docker',
  ];

  return (
    <section id="about" className="section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            About Me
          </h2>
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                I'm a BSc (Hons) Computing graduate from London Metropolitan University, passionate about full stack development. My expertise lies in building robust, user-friendly web applications using the MERN stack and modern web technologies.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                I thrive on solving complex problems with clean, efficient, and scalable code, combining technical skills with a creative approach to deliver impactful solutions.
              </p>
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Education</h3>
                <div className="glass p-6 rounded-xl">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">BSc (Hons) Computing</h4>
                  <p className="text-gray-600 dark:text-gray-300">London Metropolitan University</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Skills</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {skills.map((skill) => (
                  <motion.div
                    key={skill}
                    className="glass p-4 rounded-lg text-center text-gray-800 dark:text-gray-200"
                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  >
                    {skill}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;