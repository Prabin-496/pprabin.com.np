import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
}

const Navbar = ({ darkMode, setDarkMode }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Projects', href: '#projects' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass shadow-md">
      <div className="container flex items-center justify-between h-16">
        <motion.a
          href="#home"
          className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          whileHover={{ scale: 1.05 }}
        >
          PP
        </motion.a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <motion.a
              key={item.name}
              href={item.href}
              className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              {item.name}
            </motion.a>
          ))}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? (
              <SunIcon className="h-5 w-5 text-yellow-400" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="w-6 h-0.5 bg-gray-600 dark:bg-gray-300 mb-1.5"></div>
          <div className="w-6 h-0.5 bg-gray-600 dark:bg-gray-300 mb-1.5"></div>
          <div className="w-6 h-0.5 bg-gray-600 dark:bg-gray-300"></div>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-white dark:bg-gray-800"
        >
          <div className="container px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <button
              onClick={() => {
                setDarkMode(!darkMode);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;