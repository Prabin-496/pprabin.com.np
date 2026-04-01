import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink, Github, Mail, Linkedin, Instagram, Youtube, Menu, X, Camera, Code, Video, Globe, Image as ImageIcon, Briefcase, GraduationCap, Award, Languages } from 'lucide-react';
import MM from '../Assets/mantramountain.png';
import Ludo from '../Assets/Ludo.png';
import TH from '../Assets/travelHimalayan.png';
import MMWP from '../Assets/mmimage.png';
import hotair from '../Assets/hotair.png';
import travel from '../Assets/Tiktok_MantraPokhara.png';
import gym from '../Assets/gymThumbnail.png';
import loseWeight from '../Assets/how to lose weight.png';
import market from '../Assets/market.png';
import handpan from '../Assets/handpan.jpeg';
// Placeholder for missing images
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';




const Portfolio = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode] = useState(true);
  const [showAllProjects, setShowAllProjects] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Keep the active section aligned with the main navigation.
      const sections = ['home', 'about', 'skills', 'projects', 'experience', 'japan', 'contact'];
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

  useEffect(() => {
    // Basic SEO for a Vite SPA (no framework head manager).
    document.title = 'Prabin Parajuli | Frontend Developer (React & Next.js) - Japan';
    const description = 'Frontend Developer portfolio: React/TypeScript, MERN projects, UI/UX work, and Next.js learning. Based in Japan (Ichikawa, Chiba). Open to Tokyo roles.';

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, []);

  const projects = [
    {
      id: 1,
      title: 'Mantra Mountain',
      description: 'A comprehensive trekking package booking application built with the MERN stack. Features user authentication, package browsing, booking management, and an admin dashboard.',
      image: MM,
      technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS'],
      liveLink: 'https://mantra-mountain.vercel.app/',
      githubLink: 'https://github.com/prabin-496',
      category: 'fullstack'
    },
    {
      id: 2,
      title: 'Ludo Blockchain',
      description: 'A revolutionary blockchain-based ludo game built with the MERN stack and Solidity smart contracts.',
      image: Ludo,
      technologies: ['React', 'Solidity', 'Node.js', 'Express', 'MongoDB', 'Web3'],
      liveLink: 'https://solana-ludo-kings.vercel.app/',
      githubLink: 'https://github.com/prabin-496',
      category: 'blockchain'
    },
    {
      id: 3,
      title: 'Travel Himalayan',
      description: 'Professional travel agency website with booking functionality, built using WordPress.',
      image: TH,
      technologies: ['WordPress', 'PHP', 'MySQL'],
      liveLink: 'https://www.travelhimalayanepal.com/',
      githubLink: 'https://github.com/prabin-496',
      category: 'wordpress'
    },
    {
      id: 4,
  title: 'Mantra Mountain Nepal Treks',
  description: 'Next.js booking website for trekking and adventure activities with WhatsApp inquiry notifications.',
  image: MMWP,
  technologies: [
    'Next.js 16.2.0',
    'React 18.3.1',
    'Tailwind CSS',
    'Material UI',
    'PHP 8.2.29',
    'MySQL',
    'Turbopack',
    'Vercel'
  ],
  liveLink: 'https://www.mantramountain.com',
  githubLink: 'https://github.com/prabin-496',
  category: 'nextjs'
    },
    {
      id: 5,
      title: 'Waters Gold',
      description: 'Modern Retreat in Pokhara, Nepal serving Muay Thai and wellness programs.',
      image: PLACEHOLDER_IMAGE,
      technologies: ['WordPress', 'Custom CSS', 'JavaScript'],
      liveLink: 'https://watersgold.io/',
      githubLink: 'https://github.com/prabin-496',
      category: 'wordpress'
    },
    {
      id: 6,
      title: 'Singapore Handpans',
      description: 'E-commerce website for handcrafted handpans, showcasing instruments, sound samples, and brand story.',
      image: handpan,
      technologies: ['WordPress', 'Elementor', 'Custom CSS', 'JavaScript'],
      liveLink: 'https://singaporehandpans.com/',
      githubLink: 'https://github.com/prabin-496',
      category: 'wordpress'
    }
    
  ];

  const projectNarratives: Record<
    number,
    { problem: string[]; solution: string[]; result: string[]; features: string[] }
  > = {
    1: {
      problem: [
        'Bookings were hard to manage and users needed a clear booking flow.',
        'The admin needed a simple way to manage packages, users, and bookings.',
      ],
      solution: [
        'Built a full MERN application with user authentication and an admin dashboard.',
        'Created responsive UI for package browsing and booking management.',
        'Designed the booking workflow to reduce friction and improve conversions.',
      ],
      result: [
        'Working booking system with admin-controlled data and user journeys.',
        'Improved UX, performance, and SEO visibility for key pages.',
      ],
      features: [
        'Booking workflow UX',
        'Admin dashboard',
        'Responsive UI',
        'SEO visibility',
        'Performance-focused frontend',
      ],
    },
    2: {
      problem: [
        'Needed a modern frontend for a blockchain-based game experience.',
        'Required wallet-style interactions and smooth UX for game flows.',
      ],
      solution: [
        'Built a React UI integrated with a MERN backend and smart-contract logic.',
        'Implemented game interactions with Web3-friendly patterns.',
      ],
      result: [
        'A playable blockchain game frontend with clear UI flows.',
      ],
      features: [
        'React UX for Web3',
        'MERN architecture',
        'Smart-contract integration',
        'Performance-conscious UI',
      ],
    },
    3: {
      problem: [
        'Wanted a professional marketing + booking experience for travel services.',
        'Needed fast loading pages and clear information hierarchy.',
      ],
      solution: [
        'Delivered a WordPress site with booking functionality.',
        'Optimized responsive layout and content structure for usability.',
      ],
      result: [
        'Production-ready travel website with booking-ready UX.',
      ],
      features: [
        'Responsive WordPress UI',
        'Information architecture',
        'Usability-focused booking pages',
        'SEO-ready content structure',
      ],
    },
    4: {
      problem: [
        'Needed a clear and simple booking workflow for trekking and adventure activities.',
        'Wanted to receive booking inquiries instantly via WhatsApp rather than processing online payments.'
      ],
      solution: [
        'Built a multi-step booking workflow using Next.js, React, Tailwind CSS, and Material UI.',
        'Step 1: Users select activities/adventures they want.',
        'Step 2: Users select the number of people for each activity.',
        'Step 3: Display total amount dynamically based on selections.',
        'Step 4: Collect personal details for the booking.',
        'All booking information is sent as a structured message to WhatsApp for real-time notifications.',
        'Used PHP & MySQL to handle backend logic and store booking inquiries.'
      ],
      result: [
        'A fast, responsive, and mobile-friendly booking site.',
        'Simplified booking flow with instant WhatsApp notifications.',
        'No online payment required; admin can manage inquiries efficiently.'
      ],
      features: [
        'Next.js + React frontend',
        'Tailwind CSS responsive design',
        'Material UI components for modern UI',
        'Multi-step booking workflow',
        'Dynamic total calculation',
        'WhatsApp notifications for bookings',
        'PHP & MySQL backend for storing inquiries',
        'Performance-optimized and SEO-friendly'
      ]
    },
    5: {
      problem: [
        'Needed a modern brand website for programs and events.',
      ],
      solution: [
        'Designed and implemented a WordPress site with custom CSS/JS.',
        'Improved UI clarity and page responsiveness across devices.',
      ],
      result: [
        'A polished, modern web presence for Waters Gold.',
      ],
      features: [
        'Custom CSS/JS UI polish',
        'Responsive performance',
        'Program-focused layout',
      ],
    },
    6: {
      problem: [
        'Needed an e-commerce experience with rich product storytelling.',
      ],
      solution: [
        'Implemented an Elementor-based storefront with custom styles.',
      ],
      result: [
        'E-commerce website featuring product samples and brand story.',
      ],
      features: [
        'E-commerce UX',
        'Custom UI components',
        'Responsive storefront',
      ],
    },
  };

  const videoProjects = [
    {
      id: 1,
      title: 'Share Market Channel on TikTok',
      description: 'Nepali share market news and financial knowledge sharing. Created engaging content with high retention rates using algorithm-optimized editing techniques.',
      thumbnail: market,
      videoLink: 'https://www.tiktok.com/@money_mantra_np',
      software: 'Final Cut Pro'
    },
    {
      id: 2,
      title: 'Adventure Travel Channel on TikTok',
      description: 'Travel and places in Nepal with discount offers for travel and adventure activities. Focused on hook creation and audience retention strategies.',
      thumbnail: hotair,
      videoLink: 'https://www.tiktok.com/@this.is.non.perso',
      software: 'Final Cut Pro'
    },
    {
      id: 3,
      title: 'Travel Promo Video',
      description: 'Cinematic travel promotional video showcasing the beauty of Nepal with optimized editing for social media engagement.',
      thumbnail: travel,
      videoLink: 'https://www.youtube.com/shorts/VpZ3d9gNN1o',
      software: 'Final Cut Pro'
    },
    {
      id: 4,
      title: 'Fitness Motivation',
      description: 'High-energy fitness video focused on weight loss motivation with strategic hook placement and retention techniques.',
      thumbnail: loseWeight,
      videoLink: 'https://www.youtube.com/shorts/--vdahx_6Kc',
      software: 'Final Cut Pro'
    },
    {
      id: 5,
      title: 'Lifestyle Content',
      description: 'Creative lifestyle video with dynamic editing, color grading, and algorithm-optimized pacing for maximum engagement.',
      thumbnail: gym,
      videoLink: 'https://www.youtube.com/shorts/5Cl9mI-2HoE',
      software: 'Final Cut Pro'
    }
  ];

  const skills = [
    {
      category: 'Frontend',
      icon: <Code className="w-6 h-6" />,
      skills: [
        'React',
        'Next.js (learning)',
        'JavaScript',
        'TypeScript',
        'Tailwind CSS',
        'Responsive Web Design',
        'Performance Optimization',
        'Component-Based Architecture',
      ]
    },
    {
      category: 'Tools',
      icon: <Github className="w-6 h-6" />,
      skills: ['Git', 'GitHub', 'Vercel Deployment']
    },
    {
      category: 'Full-stack & APIs',
      icon: <Globe className="w-6 h-6" />,
      skills: ['MERN Stack', 'MongoDB', 'Express', 'Node.js', 'REST APIs']
    },
    {
      category: 'UI/UX & CMS (supporting)',
      icon: <Code className="w-6 h-6" />,
      skills: ['Figma', 'UI/UX Design', 'Admin Dashboards', 'Content Management', 'WordPress', 'WooCommerce', 'SEO Optimization']
    },
    {
      category: 'Side Work (Creative)',
      icon: <Video className="w-6 h-6" />,
      skills: ['Final Cut Pro (side projects)']
    }
  ];

  const workExperience = [
    {
      id: 1,
      company: 'Mantra Mountain',
      position: 'Full-Stack Developer',
      location: 'Nepal',
      period: 'Jan 2024 - 2025',
      description: 'Built the initial company website using the MERN stack. Currently managing the live WordPress site, optimizing UX and content. Improved booking workflows, performance, and SEO visibility.',
      highlights: [
        'Built a production-ready MERN web application foundation for company bookings and workflows.',
        'Managed the live WordPress experience, focusing on UI/UX, content clarity, and usability.',
        'Improved booking flow usability and reduced friction in key user steps.',
        'Optimized frontend performance and strengthened SEO visibility for important pages.',
      ],
      technologies: ['MERN Stack', 'WordPress', 'React', 'Node.js', 'MongoDB', 'SEO']
    },
    {
      id: 2,
      company: 'Basiyo',
      position: 'Campaign Manager / Web & UI Operations',
      location: 'Nepal',
      period: 'Feb 2022 - 2024',
      description: 'Managed frontend content and admin dashboards for digital campaigns. Optimized UI/UX of landing pages to improve user experience. Tracked performance metrics and coordinated updates with design and dev teams.',
      highlights: [
        'Owned frontend campaign updates and kept admin dashboards usable for the team.',
        'Improved landing page UI/UX to increase clarity, engagement, and user experience.',
        'Tracked performance metrics and coordinated fast iterations with design and development.',
      ],
      technologies: ['UI/UX Design', 'Admin Dashboards', 'Content Management', 'Performance Analytics']
    },
    {
      id: 3,
      company: 'S.A I.T Solution and Trade Concern',
      position: 'Web Developer',
      location: 'Nepal',
      period: 'Mar 2020 - Jan 2022',
      description: 'Developed and maintained business websites and landing pages. Implemented responsive UI designs and optimized site performance. Collaborated with clients to deliver functional, production-ready solutions.',
      highlights: [
        'Developed and maintained business websites and landing pages from requirements to production.',
        'Implemented responsive UI and performance improvements for better loading and UX.',
        'Collaborated with clients to deliver functional, production-ready solutions.',
      ],
      technologies: ['Web Development', 'Responsive Design', 'Client Collaboration', 'Performance Optimization']
    }
  ];

  const education = [
    {
      id: 1,
      degree: "Bachelor's Degree in Computing",
      institution: 'London Metropolitan University',
      location: 'Informatics College Pokhara',
      period: 'Mar 2023 – Dec 2025',
      focus: 'Focus on Web Development, Software Engineering, Databases, and Application Design.'
    },
    {
      id: 2,
      degree: 'High School Diploma',
      institution: 'Motherland Secondary School',
      location: 'Nepal',
      period: 'Jan 2017 – Oct 2019',
      focus: 'Business Administration & Management'
    }
  ];

  const certifications = [
    'Figma for UX Design',
    'Learning npm',
    'Microsoft 365 Copilot First Look',
    'Objects in JavaScript',
    'React & Node.js (Multiple Certifications)'
  ];

  const languages = [
    { name: 'English', level: 'Fluent' },
    { name: 'Nepali', level: 'Native' },
    { name: 'Japanese', level: 'JLPT N5–N4 (Basic Communication)' }
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
            {['Home', 'About', 'Skills', 'Projects', 'Experience', 'Japan', 'Contact'].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  activeSection === item.toLowerCase().replace(' ', '-')
                    ? 'text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-400'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                {item}
                {activeSection === item.toLowerCase().replace(' ', '-') && (
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
              {['Home', 'About', 'Skills', 'Projects', 'Experience', 'Japan', 'Contact'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
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
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-2xl opacity-60"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-2xl opacity-60"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/20 rounded-full blur-2xl opacity-60"></div>
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
              Available for frontend roles in Japan
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
            Frontend Developer | React & Next.js
          </motion.h2>

          <motion.p
            className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Frontend engineer focused on React/TypeScript UI, production MERN work, and performance-focused UX. Based in Japan (Tokyo area). Open to React/Next.js roles.
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
              <span className="relative z-10">View Projects</span>
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
              Contact Me
            </motion.a>
          </motion.div>

          <motion.div
            className="flex justify-center gap-6 mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            {[
              { href: "https://github.com/Prabin-496", icon: <Github className="w-5 h-5" />, label: "GitHub" },
              { href: "https://www.linkedin.com/in/prabin-parajuli-techie496/", icon: <Linkedin className="w-5 h-5" />, label: "LinkedIn" },
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
        animate={{ y: 0 }}
        transition={{ duration: 0 }}
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
                About
              </span>
            </motion.h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="text-lg">
                  Computer Science graduate (BSc Computing, London Metropolitan University), based in <span className="font-semibold text-gray-800 dark:text-gray-200">Ichikawa, Chiba (Tokyo area)</span>.
                </li>
                <li className="text-lg">
                  Frontend focus: <span className="font-semibold text-gray-800 dark:text-gray-200">React</span> with <span className="font-semibold text-gray-800 dark:text-gray-200">JavaScript/TypeScript</span>, building responsive, component-based UI.
                </li>
                <li className="text-lg">
                  Real-world experience: <span className="font-semibold text-gray-800 dark:text-gray-200">Mantra Mountain</span> (MERN booking workflows + admin dashboard) and ongoing UI/UX improvements.
                </li>
                <li className="text-lg">
                  Problem-solving mindset: I improve <span className="font-semibold text-gray-800 dark:text-gray-200">usability</span>, <span className="font-semibold text-gray-800 dark:text-gray-200">performance</span>, and <span className="font-semibold text-gray-800 dark:text-gray-200">SEO-ready UI</span>.
                </li>
                <li className="text-lg">
                  Japanese advantage: <span className="font-semibold text-gray-800 dark:text-gray-200">JLPT N5–N4 (basic communication)</span> and <span className="font-semibold text-gray-800 dark:text-gray-200">English</span> proficiency for international teams.
                </li>
                <li className="text-lg">
                  Next.js learning in progress, while continuing to ship production UI.
                </li>
                <li className="text-lg">
                  Video editing stays as a creative side project (kept on this portfolio as additional work).
                </li>
              </ul>
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
                    <div className="text-6xl mb-4">Frontend</div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Frontend Developer</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                      React + TypeScript UI, MERN experience, Figma-driven UI/UX, and performance-focused implementation.
                    </p>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p>Education: Bachelor's Degree in Computing</p>
                      <p>London Metropolitan University</p>
                      <p>Ichikawa, Chiba, Japan</p>
                    </div>
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

  const Experience = () => (
    <section id="experience" className="py-32 relative">
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
                Work Experience
              </span>
            </motion.h2>
          </div>

          <div className="space-y-8">
            {workExperience.map((exp, index) => (
              <motion.div
                key={exp.id}
                className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl">
                      <Briefcase className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                        {exp.position}
                      </h3>
                      <p className="text-lg text-blue-400 font-semibold mb-1">
                        {exp.company}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {exp.location} • {exp.period}
                      </p>
                    </div>
                  </div>
                </div>
                <ul className="text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                  {exp.highlights.map((h) => (
                    <li key={h} className="leading-relaxed text-sm sm:text-base">
                      - {h}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  {exp.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 text-sm rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );

  const JapanReadiness = () => (
    <section id="japan" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/25 to-transparent dark:via-gray-900/30" />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Japan Readiness
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Hiring in Japan is a good fit. I can contribute immediately in frontend engineering and adapt quickly to team workflows.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="text-3xl mb-4">Japan</div>
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Based in Japan</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>Ichikawa, Chiba (Tokyo area)</li>
              <li>Available for frontend roles in Japan</li>
              <li>Ready for interviews and onboarding</li>
            </ul>
          </div>

          <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="text-3xl mb-4">Languages</div>
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">English + Japanese</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              {languages.map((lang) => (
                <li key={lang.name}>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{lang.name}:</span> {lang.level}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="text-3xl mb-4">Team</div>
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Team-ready engineer</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>Frontend-focused mindset (React, TypeScript, performance)</li>
              <li>Works well with designers (Figma/UI/UX)</li>
              <li>Learning Next.js while building production UI</li>
            </ul>
            <div className="mt-6">
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
              >
                Open to Frontend Roles (Japan)
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const EducationSection = () => (
    <section id="education" className="py-32 relative">
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
                Education
              </span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {education.map((edu, index) => (
              <motion.div
                key={edu.id}
                className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl">
                    <GraduationCap className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                      {edu.degree}
                    </h3>
                    <p className="text-lg text-blue-400 font-semibold mb-2">
                      {edu.institution}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {edu.location} • {edu.period}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {edu.focus}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Certifications & Languages */}
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-8 h-8 text-purple-400" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Certifications
                </h3>
              </div>
              <div className="space-y-2">
                {certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-gray-600 dark:text-gray-400"
                  >
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Languages className="w-8 h-8 text-pink-400" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Languages
                </h3>
              </div>
              <div className="space-y-3">
                {languages.map((lang, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 dark:bg-gray-700/20 rounded-xl"
                  >
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {lang.name}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {lang.level}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
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
            <motion.p
              className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Production-oriented work focused on frontend engineering, UX, and performance. Mantra Mountain is the featured full-stack application.
            </motion.p>
          </div>

          {(() => {
            const featuredIds = [1, 2, 3, 4];
            const featuredProjects = projects.filter((p) => featuredIds.includes(p.id));
            const extraProjects = projects.filter((p) => !featuredIds.includes(p.id));

            const renderCard = (project: any, isFeatured: boolean) => {
              const narrative = projectNarratives[project.id];

              return (
                <motion.div
                  key={project.id}
                  className={`group bg-white/10 dark:bg-gray-800/30 rounded-3xl overflow-hidden border border-white/20 shadow-2xl ${
                    project.id === 1 ? 'lg:col-span-2' : ''
                  }`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="aspect-video overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {project.image ? (
                      <motion.img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                        <ImageIcon className="w-16 h-16 mb-2" />
                        <span className="text-sm">Image not available</span>
                      </div>
                    )}
                  </div>

                  <div className="p-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{project.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {project.category ? `${project.category.toUpperCase()}` : ''}
                        </p>
                      </div>
                      {isFeatured && (
                        <span className="px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Featured
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-5 leading-relaxed text-sm">
                      {project.description}
                    </p>

                    {narrative && (
                      <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white/5 dark:bg-gray-700/20 rounded-2xl p-4 border border-white/10">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Problem</p>
                          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {narrative.problem.map((t) => (
                              <li key={t}>- {t}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-white/5 dark:bg-gray-700/20 rounded-2xl p-4 border border-white/10">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Solution</p>
                          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {narrative.solution.map((t) => (
                              <li key={t}>- {t}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-white/5 dark:bg-gray-700/20 rounded-2xl p-4 border border-white/10">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Result</p>
                          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {narrative.result.map((t) => (
                              <li key={t}>- {t}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Tech stack</p>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech: string) => (
                          <span
                            key={tech}
                            className="px-3 py-1 text-sm rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {narrative?.features?.length ? (
                      <div className="mb-6">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Key features</p>
                        <div className="flex flex-wrap gap-2">
                          {narrative.features.map((f) => (
                            <span
                              key={f}
                              className="px-3 py-1 text-sm rounded-full bg-white/20 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 border border-white/10"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-4">
                      <motion.a
                        href={project.liveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Live Demo
                      </motion.a>
                      {project.githubLink && project.githubLink !== '#' && (
                        <motion.a
                          href={project.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:border-blue-500 transition-all duration-300"
                        >
                          <Github className="w-4 h-4" />
                          GitHub
                        </motion.a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            };

            return (
              <>
                <div className="grid lg:grid-cols-2 gap-8 mb-16">
                  {featuredProjects.map((project) => (
                    <div key={project.id} className={project.id === 1 ? 'lg:col-span-2' : ''}>
                      {renderCard(project, project.id === 1)}
                    </div>
                  ))}
                </div>

                {extraProjects.length > 0 && !showAllProjects && (
                  <div className="flex justify-center mb-16">
                    <button
                      type="button"
                      onClick={() => setShowAllProjects(true)}
                      className="px-8 py-4 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:border-blue-500 transition-all duration-300"
                    >
                      Show more web projects
                    </button>
                  </div>
                )}

                {extraProjects.length > 0 && showAllProjects && (
                  <div className="grid lg:grid-cols-2 gap-8 mb-16">
                    {extraProjects.map((project) => renderCard(project, false))}
                    <div className="lg:col-span-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setShowAllProjects(false)}
                        className="px-8 py-4 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:border-blue-500 transition-all duration-300"
                      >
                        Show less
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

        </motion.div>
      </div>
    </section>
  );

  const VideoEditing = () => (
    <section id="video-editing" className="py-32 relative">
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
                Video Editing
              </span>
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              A creative side project — video content creation with Final Cut Pro, social media optimization, and content strategy
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
                <Video className="w-12 h-12 text-blue-400 mb-6" />
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                  Final Cut Pro Specialist
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  With extensive experience in Final Cut Pro, I create engaging video content optimized for social media platforms. My expertise includes color grading, motion graphics, transitions, and audio mixing to produce professional-quality videos that drive engagement.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Algorithm-Optimized Editing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Hook Creation & Audience Retention</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Content Strategy & Scripting</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <Code className="w-12 h-12 text-purple-400 mb-6" />
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                  Content Creation & Strategy
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  Beyond editing, I excel in content writing, scripting, and understanding social media algorithms. I've studied extensively on how to beat social media algorithms, focusing on audience retention, hook creation, and engagement optimization.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Social Media Algorithm Expertise</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Script Writing & Storytelling</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Performance Analytics & Optimization</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Video Projects Showcase */}
          <div className="mt-20">
            <motion.h3
              className="text-3xl font-bold mb-12 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Featured Video Projects
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
                  <div className="aspect-video relative overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {video.thumbnail ? (
                      <motion.img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <ImageIcon className="w-16 h-16" />
                      </div>
                    )}
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

          {/* Skills Showcase */}
          <motion.div
            className="mt-20 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
          >
            <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl">
              <Youtube className="w-16 h-16 text-red-400 mx-auto mb-6" />
              <h3 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                Creative Side Projects
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Outside of web development, I create video content using Final Cut Pro. These projects showcase my ability to combine creative editing, content strategy, and social media optimization.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white/5 dark:bg-gray-700/20 rounded-2xl p-6">
                  <div className="text-3xl mb-3">Video</div>
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Video Editing</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Final Cut Pro Expert</p>
                </div>
                <div className="bg-white/5 dark:bg-gray-700/20 rounded-2xl p-6">
                  <div className="text-3xl mb-3">Optimization</div>
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Algorithm Knowledge</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Social Media Optimization</p>
                </div>
                <div className="bg-white/5 dark:bg-gray-700/20 rounded-2xl p-6">
                  <div className="text-3xl mb-3">Content</div>
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Content Creation</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Scripting & Strategy</p>
                </div>
              </div>
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(formData);
      setIsSubmitting(false);
      setFormData({ name: '', email: '', message: '' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                  Contact
                </span>
              </motion.h2>
              <motion.p
                className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Open to Frontend Developer opportunities in Japan (React / Next.js). Send a message or reach out via the links below.
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
                    I build production-ready frontend UI with React/TypeScript and MERN experience, plus UI/UX work in Figma. Happy to discuss frontend roles in Japan and start quickly.
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
                      icon: <Github className="w-6 h-6" />,
                      label: 'GitHub',
                      value: 'prabin-496',
                      href: 'https://github.com/prabin-496'
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
              Frontend Engineer & Web Developer · Based in Tokyo, Japan
            </p>
            <a href="/transcriber.html">AI Transcriber</a>
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
              { href: "https://github.com/prabin-496", icon: <Github className="w-5 h-5" /> },
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
            © 2025 Prabin Parajuli. All rights reserved. Based in Tokyo, Japan.
          </p>
        </motion.div>
      </div>
    </footer>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 transition-colors duration-300">
        <Navigation />
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <JapanReadiness />
        <EducationSection />
        <VideoEditing />
        <Contact />
        <Footer />
      </div>
    </div>
  );
};

export default Portfolio;