import React from 'react';
import { motion } from 'framer-motion';
import { FaExternalLinkAlt, FaGithub } from 'react-icons/fa';
import Mantramountain from '../Assets/mantramountain.png';
import Ludo from '../Assets/Ludo.png';
import travelHimalayan from '../assets/travelHimalayan.png'
//for vercel the Assets is capital

const Projects = () => {
  const projects = [
    {
      title: 'Mantra Mountain',
      description:
        'A trekking package booking application built with the MERN stack. Features user authentication, package browsing, booking management, and an admin dashboard.',
      image: Mantramountain,
      technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS'],
      liveLink: 'https://mantra-mountain.vercel.app/',
    },
    {
      title: 'Ludo Blockchain',
      description:
        'A blockchain-based ludo game built with the MERN stack and solidity',
      image:Ludo,
      technologies: ['React', 'solidity','Node.js', 'Express', 'MongoDB', 'Tailwind CSS'],
      liveLink: 'https://solana-ludo-kings.vercel.app/',
    },
    {
      title: 'Travel Himalayan',
      description:
        'Made using wordpress by Prabin Parajuli',
      image:travelHimalayan,
      technologies: ['Wordpress'],
      liveLink: 'https://www.travelhimalayanepal.com/',
    },

  ];

  return (
    <section id="projects" className="section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Projects
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project) => (
              <motion.div
                key={project.title}
                className="glass rounded-xl overflow-hidden shadow-lg"
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <div className="aspect-[16/5] bg-gradient-to-br from-primary/20 to-secondary/20">
                <img src={project.image} alt="" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-800 dark:text-gray-200">{project.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <motion.a
                      href={project.liveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <FaExternalLinkAlt /> Live Demo
                    </motion.a>
                    <motion.a
                      href={project.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <FaGithub /> Source Code
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Projects;



// this is kust to add the changes to the commit