import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink, Github, Mail, Linkedin, Instagram, Youtube, Menu, X, Camera, Code, Video, Globe } from 'lucide-react';
import MM from '../Assets/mantramountain.png';
import Ludo from '../Assets/Ludo.png';
import TH from '../Assets/travelHimalayan.png';
import WG from '../Assets/watersgold.png';
import MMWP from '../Assets/mmimage.png';
import MMPROMO from '../Assets/MMPROMO.png';
import HowToLoseWeight  from '../Assets/HowToLoseWeight.png';
import pullup from '../Assets/pullup.png';



const Portfolio = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'skills', 'projects', 'photography', 'contact'];
      const scrollPosition = window.scrollY + 100;

      sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const projects = [
    {
      id: 1,
      title: 'Mantra Mountain',
      description: 'A comprehensive trekking package booking application built with the MERN stack. Features user authentication, package browsing, booking management, and an admin dashboard.',
      image: MM,
      technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS'],
      liveLink: 'https://mantra-mountain.vercel.app/',
      githubLink: '#',
      category: 'fullstack'
    },
    {
      id: 2,
      title: 'Ludo Blockchain',
      description: 'A revolutionary blockchain-based ludo game built with the MERN stack and Solidity smart contracts.',
      image: Ludo,
      technologies: ['React', 'Solidity', 'Node.js', 'Express', 'MongoDB', 'Web3'],
      liveLink: 'https://solana-ludo-kings.vercel.app/',
      githubLink: '#',
      category: 'blockchain'
    },
    {
      id: 3,
      title: 'Travel Himalayan',
      description: 'Professional travel agency website with booking functionality, built using WordPress.',
      image: TH,
      technologies: ['WordPress', 'PHP', 'MySQL'],
      liveLink: 'https://www.travelhimalayanepal.com/',
      category: 'wordpress'
    },
    {
      id: 4,
      title: 'Mantra Mountain Nepal Treks',
      description: 'Corporate booking website for trekking packages with integrated payment system.',
      image: MMWP,
      technologies: ['WordPress', 'WooCommerce', 'Custom PHP'],
      liveLink: 'https://www.mantramountain.com',
      category: 'wordpress'
    },
    {
      id: 5,
      title: 'Waters Gold',
      description: 'Modern Retreat in Pokhara, Nepal serving Muay Thai and wellness programs.',
      image: WG,
      technologies: ['WordPress', 'Custom CSS', 'JavaScript'],
      liveLink: 'https://watersgold.io/',
      category: 'wordpress'
    }
  ];

  const videoProjects = [
    {
      id: 1,
      title: 'Travel Promo Video',
      description: 'Cinematic travel promotional video showcasing the beauty of Nepal.',
      thumbnail: MMPROMO,
      videoLink: 'https://www.youtube.com/shorts/VpZ3d9gNN1o',
      software: 'DaVinci Resolve'
    },
    {
      id: 2,
      title: 'Fitness Motivation',
      description: 'High-energy fitness video focused on weight loss motivation.',
      thumbnail: HowToLoseWeight,
      videoLink: 'https://www.youtube.com/shorts/--vdahx_6Kc',
      software: 'DaVinci Resolve'
    },
    {
      id: 3,
      title: 'Lifestyle Content',
      description: 'Creative lifestyle video with dynamic editing and color grading.',
      thumbnail: pullup,
      videoLink: 'https://www.youtube.com/shorts/5Cl9mI-2HoE',
      software: 'DaVinci Resolve'
    }
  ];

  const skills = [
    {
      category: 'Frontend Development',
      icon: <Code className="w-6 h-6" />,
      skills: ['React', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'HTML5', 'CSS3']
    },
    {
      category: 'Backend Development',
      icon: <Globe className="w-6 h-6" />,
      skills: ['Node.js', 'Express', 'MongoDB', 'MySQL', 'REST APIs', 'GraphQL']
    },
    {
      category: 'Video Editing',
      icon: <Video className="w-6 h-6" />,
      skills: ['DaVinci Resolve', 'Adobe Premiere', 'Color Grading', 'Motion Graphics']
    },
    {
      category: 'Photography',
      icon: <Camera className="w-6 h-6" />,
      skills: ['Portrait Photography', 'Landscape', 'Street Photography', 'Photo Editing']
    }
  ];

  const Navigation = () => (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 bg-white/10 dark:bg-gray-900/10 backdrop-blur-xl border-b border-white/20"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div 
            className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
          >
            Prabin.Parajuli
          </motion.div>

          <div className="hidden md:flex items-center space-x-8">
            {['Home', 'About', 'Skills', 'Projects', 'Photography', 'Contact'].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  activeSection === item.toLowerCase()
                    ? 'text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-400'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                {item}
                {activeSection === item.toLowerCase() && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                    layoutId="activeTab"
                  />
                )}
              </motion.a>
            ))}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="px-6 py-4 space-y-4">
              {['Home', 'About', 'Skills', 'Projects', 'Photography', 'Contact'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="block text-gray-600 dark:text-gray-300 hover:text-blue-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );

  const Hero = () => (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center">
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
            </motion.span>
          </motion.h1>

          <motion.h2
            className="text-2xl sm:text-3xl lg:text-4xl text-gray-600 dark:text-gray-300 mb-8 font-light"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Full Stack Developer & Creative Professional
          </motion.h2>

          <motion.p
            className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Crafting exceptional digital experiences with modern technologies. Specialized in MERN stack development, video editing, and photography - creating solutions that make a difference.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-6 justify-center"
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
              href="#contact"
              className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-2xl text-gray-700 dark:text-gray-300 font-semibold hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 backdrop-blur-sm"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Get In Touch
            </motion.a>
          </motion.div>

          <motion.div
            className="flex justify-center gap-6 mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            {[
              { href: "https://www.linkedin.com/in/prabin-parajuli-techie496/", icon: <Linkedin className="w-5 h-5" />, label: "LinkedIn" },
              { href: "https://github.com/prabin_496", icon: <Github className="w-5 h-5" />, label: "GitHub" },
              { href: "https://www.instagram.com/prabin_496/", icon: <Instagram className="w-5 h-5" />, label: "Instagram" }
            ].map((social, index) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 rounded-2xl bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all duration-300"
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
        </div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="w-6 h-6 text-gray-400" />
      </motion.div>
    </section>
  );

  const About = () => (
    <section id="about" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
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
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                I'm a passionate Full Stack Developer and creative professional based in Pokhara, Nepal. With expertise in modern web technologies and a keen eye for design, I create digital experiences that are both functional and beautiful.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                Beyond coding, I'm also a photographer and video editor, bringing a unique creative perspective to every project. I believe in the power of technology to solve real-world problems and create meaningful connections.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                When I'm not developing applications, you can find me exploring the mountains of Nepal with my camera, creating visual stories that capture the beauty of our world.
              </p>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 p-8">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-400/10 to-purple-400/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🚀</div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Always Learning</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Constantly exploring new technologies and creative techniques to deliver innovative solutions.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );

  const Skills = () => (
    <section id="skills" className="py-32 relative">
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
                Skills & Expertise
              </span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {skills.map((skillCategory, index) => (
              <motion.div
                key={skillCategory.category}
                className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl w-fit">
                  {skillCategory.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                  {skillCategory.category}
                </h3>
                <div className="space-y-2">
                  {skillCategory.skills.map((skill) => (
                    <div
                      key={skill}
                      className="px-3 py-1 text-sm rounded-full bg-white/20 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );

  const Projects = () => (
    <section id="projects" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
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
                Featured Projects
              </span>
            </motion.h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                className="group bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="aspect-video overflow-hidden">
                  <motion.img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 text-sm rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"
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
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Live Demo
                    </motion.a>
                    {project.githubLink && (
                      <motion.a
                        href={project.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:border-blue-500 transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Github className="w-4 h-4" />
                        Code
                      </motion.a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Video Projects Section */}
          <div className="mt-20">
            <motion.h3
              className="text-3xl font-bold mb-12 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Video Editing Showcase
              </span>
            </motion.h3>

            <div className="grid md:grid-cols-3 gap-8">
              {videoProjects.map((video, index) => (
                <motion.div
                  key={video.id}
                  className="group bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <motion.img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <motion.a
                        href={video.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-red-600 rounded-full text-white"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Youtube className="w-8 h-8" />
                      </motion.a>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">
                      {video.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                      {video.description}
                    </p>
                    <span className="px-3 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {video.software}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );

  const Photography = () => (
    <section id="photography" className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-50/30 to-transparent dark:via-gray-900/30"></div>
      
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
                Photography Journey
              </span>
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Capturing moments and telling stories through the lens - explore my photographic adventures
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <Camera className="w-12 h-12 text-blue-400 mb-6" />
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                  Visual Storytelling
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  Photography is my passion for capturing the beauty of Nepal's landscapes, 
                  culture, and people. Each image tells a unique story, from the majestic 
                  Himalayas to the vibrant streets of Pokhara.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Landscape Photography</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Street Photography</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Portrait Photography</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
                  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=400&fit=crop',
                  'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400&h=400&fit=crop',
                  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop'
                ].map((image, index) => (
                  <motion.div
                    key={index}
                    className="aspect-square rounded-2xl overflow-hidden shadow-xl"
                    whileHover={{ scale: 1.05, rotate: index % 2 === 0 ? 2 : -2 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={image}
                      alt={`Photography ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Instagram Showcase */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
          >
            <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl">
              <Instagram className="w-16 h-16 text-pink-400 mx-auto mb-6" />
              <h3 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                Follow My Photography Journey
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Join me on Instagram to see my latest photography work, behind-the-scenes content, 
                and adventures through the beautiful landscapes of Nepal.
              </p>
              <motion.a
                href="https://www.instagram.com/prabininthecity/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Instagram className="w-5 h-5" />
                @prabininthecity
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );

  const Contact = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(formData);
      setIsSubmitting(false);
      setFormData({ name: '', email: '', message: '' });
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
      <section id="contact" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-50/30 to-transparent dark:via-gray-900/30"></div>
        
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
                  Let's Connect
                </span>
              </motion.h2>
              <motion.p
                className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Ready to bring your ideas to life? Let's discuss your next project!
              </motion.p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16">
              <motion.div
                className="space-y-8"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
                    Get in Touch
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                    I'm always excited to work on new projects and collaborate with amazing people. 
                    Whether you have a project in mind or just want to say hello, feel free to reach out!
                  </p>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      icon: <Mail className="w-6 h-6" />,
                      label: 'Email',
                      value: 'prabinparajuli496@gmail.com',
                      href: 'mailto:prabinparajuli496@gmail.com'
                    },
                    {
                      icon: <Linkedin className="w-6 h-6" />,
                      label: 'LinkedIn',
                      value: 'Connect with me',
                      href: 'https://www.linkedin.com/in/prabin-parajuli-techie496/'
                    },
                    {
                      icon: <Instagram className="w-6 h-6" />,
                      label: 'Instagram',
                      value: '@prabin_496',
                      href: 'https://www.instagram.com/prabin_496/'
                    }
                  ].map((contact, index) => (
                    <motion.a
                      key={contact.label}
                      href={contact.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-4 p-6 bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all duration-300"
                      whileHover={{ scale: 1.02, x: 10 }}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <div className="text-blue-400">{contact.icon}</div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                          {contact.label}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {contact.value}
                        </p>
                      </div>
                      <div className="ml-auto text-blue-500 dark:text-blue-400 group-hover:translate-x-2 transition-transform">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </motion.a>
                  ))}
                </div>
              </motion.div>

              <motion.form
                onSubmit={handleSubmit}
                className="space-y-6"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                        Your Name
                      </label>
                      <motion.input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-gray-700/30 border border-white/30 dark:border-gray-600/30 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all duration-300"
                        placeholder="Enter your name"
                        required
                        whileFocus={{ scale: 1.02 }}
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                        Email Address
                      </label>
                      <motion.input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-gray-700/30 border border-white/30 dark:border-gray-600/30 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all duration-300"
                        placeholder="your@email.com"
                        required
                        whileFocus={{ scale: 1.02 }}
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                        Message
                      </label>
                      <motion.textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-gray-700/30 border border-white/30 dark:border-gray-600/30 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all duration-300 resize-none"
                        placeholder="Tell me about your project..."
                        required
                        whileFocus={{ scale: 1.02 }}
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.div
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Mail className="w-5 h-5" />
                          Send Message
                        </span>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.form>
            </div>
          </motion.div>
        </div>
      </section>
    );
  };

  const Footer = () => (
    <footer className="py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <motion.div
            className="mb-4 md:mb-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Prabin.Parajuli
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Full Stack Developer & Creative Professional
            </p>
          </motion.div>

          <motion.div
            className="flex gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {[
              { href: "https://www.linkedin.com/in/prabin-parajuli-techie496/", icon: <Linkedin className="w-5 h-5" /> },
              { href: "https://github.com/prabin_496", icon: <Github className="w-5 h-5" /> },
              { href: "https://www.instagram.com/prabin_496/", icon: <Instagram className="w-5 h-5" /> },
              { href: "https://www.instagram.com/prabininthecity/", icon: <Camera className="w-5 h-5" /> }
            ].map((social, index) => (
              <motion.a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-blue-400 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all duration-300"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                {social.icon}
              </motion.a>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="mt-8 pt-8 border-t border-white/10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            © 2025 Prabin Parajuli. All rights reserved. Made with ❤️ in Nepal.
          </p>
        </motion.div>
      </div>
    </footer>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
        <Navigation />
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Photography />
        <Contact />
        <Footer />
      </div>
    </div>
  );
};

export default Portfolio;