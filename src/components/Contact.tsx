// import React, { useState } from 'react';
// import { motion } from 'framer-motion';

// // // Contact Component
// // const Contact = () => {
// //   const [formData, setFormData] = useState({
// //     name: '',
// //     email: '',
// //     message: '',
// //   });
// //   const [isSubmitting, setIsSubmitting] = useState(false);

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     setIsSubmitting(true);
// //     // Simulate form submission
// //     await new Promise(resolve => setTimeout(resolve, 2000));
// //     console.log(formData);
// //     setIsSubmitting(false);
// //     setFormData({ name: '', email: '', message: '' });
// //   };

// //   const handleChange = (e) => {
// //     const { name, value } = e.target;
// //     setFormData((prev) => ({ ...prev, [name]: value }));
// //   };

// //   return (
// //     <section id="contact" className="py-32 relative overflow-hidden">
// //       <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-50/30 to-transparent dark:via-gray-900/30"></div>
      
// //       <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
// //         <motion.div
// //           initial={{ opacity: 0, y: 50 }}
// //           whileInView={{ opacity: 1, y: 0 }}
// //           viewport={{ once: true }}
// //           transition={{ duration: 0.8 }}
// //         >
// //           <div className="text-center mb-20">
// //             <motion.h2
// //               className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
// //               initial={{ opacity: 0, y: 30 }}
// //               whileInView={{ opacity: 1, y: 0 }}
// //               viewport={{ once: true }}
// //             >
// //               <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
// //                 Let's Connect
// //               </span>
// //             </motion.h2>
// //             <motion.p
// //               className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
// //               initial={{ opacity: 0, y: 20 }}
// //               whileInView={{ opacity: 1, y: 0 }}
// //               viewport={{ once: true }}
// //               transition={{ delay: 0.2 }}
// //             >
// //               Ready to bring your ideas to life? Let's discuss your next project!
// //             </motion.p>
// //           </div>

// //           <div className="grid lg:grid-cols-2 gap-16">
// //             <motion.div
// //               className="space-y-8"
// //               initial={{ opacity: 0, x: -50 }}
// //               whileInView={{ opacity: 1, x: 0 }}
// //               viewport={{ once: true }}
// //               transition={{ delay: 0.3 }}
// //             >
// //               <div>
// //                 <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
// //                   Get in Touch
// //                 </h3>
// //                 <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
// //                   I'm always excited to work on new projects and collaborate with amazing people. Whether you have a project in mind or just want to say hello, feel free to reach out!
// //                 </p>
// //               </div>

// //               <div className="space-y-6">
// //                 {[
// //                   {
// //                     icon: '📧',
// //                     label: 'Email',
// //                     value: 'prabinparajuli496@gmail.com',
// //                     href: 'mailto:prabinparajuli496@gmail.com'
// //                   },
// //                   {
// //                     icon: '💼',
// //                     label: 'LinkedIn',
// //                     value: 'Connect with me',
// //                     href: 'https://www.linkedin.com/in/prabin-parajuli-techie496/'
// //                   },
// //                   {
// //                     icon: '📸',
// //                     label: 'Instagram',
// //                     value: '@mantramountain',
// //                     href: 'https://www.instagram.com/prabin_496/'
// //                   }
// //                 ].map((contact, index) => (
// //                   <motion.a
// //                     key={contact.label}
// //                     href={contact.href}
// //                     target="_blank"
// //                     rel="noopener noreferrer"
// //                     className="group flex items-center gap-4 p-6 bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all duration-300"
// //                     whileHover={{ scale: 1.02, x: 10 }}
// //                     initial={{ opacity: 0, x: -20 }}
// //                     whileInView={{ opacity: 1, x: 0 }}
// //                     viewport={{ once: true }}
// //                     transition={{ delay: 0.4 + index * 0.1 }}
// //                   >
// //                     <div className="text-3xl">{contact.icon}</div>
// //                     <div>
// //                       <h4 className="font-semibold text-gray-800 dark:text-gray-200">
// //                         {contact.label}
// //                       </h4>
// //                       <p className="text-gray-600 dark:text-gray-400">
// //                         {contact.value}
// //                       </p>
// //                     </div>
// //                     <div className="ml-auto text-blue-500 dark:text-blue-400 group-hover:translate-x-2 transition-transform">
// //                       →
// //                     </div>
// //                   </motion.a>
// //                 ))}
// //               </div>
// //             </motion.div>

// //             <motion.form
// //               onSubmit={handleSubmit}
// //               className="space-y-6"
// //               initial={{ opacity: 0, x: 50 }}
// //               whileInView={{ opacity: 1, x: 0 }}
// //               viewport={{ once: true }}
// //               transition={{ delay: 0.5 }}
// //             >
// //               <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
// //                 <div className="space-y-6">
// //                   <div>
// //                     <label htmlFor="name" className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
// //                       Your Name
// //                     </label>
// //                     <motion.input
// //                       type="text"
// //                       id="name"
// //                       name="name"
// //                       value={formData.name}
// //                       onChange={handleChange}
// //                       className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-gray-700/30 border border-white/30 dark:border-gray-600/30 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all duration-300"
// //                       placeholder="Enter your name"
// //                       required
// //                       whileFocus={{ scale: 1.02 }}
// //                     />
// //                   </div>

// //                   <div>
// //                     <label htmlFor="email" className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
// //                       Email Address
// //                     </label>
// //                     <motion.input
// //                       type="email"
// //                       id="email"
// //                       name="email"
// //                       value={formData.email}
// //                       onChange={handleChange}
// //                       className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-gray-700/30 border border-white/30 dark:border-gray-600/30 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all duration-300"
// //                       placeholder="your@email.com"
// //                       required
// //                       whileFocus={{ scale: 1.02 }}
// //                     />
// //                   </div>

// //                   <div>
// //                     <label htmlFor="message" className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
// //                       Message
// //                     </label>
// //                     <motion.textarea
// //                       id="message"
// //                       name="message"
// //                       value={formData.message}
// //                       onChange={handleChange}
// //                       rows={5}
// //                       className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-gray-700/30 border border-white/30 dark:border-gray-600/30 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all duration-300 resize-none"
// //                       placeholder="Tell me about your project..."
// //                       required
// //                       whileFocus={{ scale: 1.02 }}
// //                     />
// //                   </div>

// //                   <motion.button
// //                     type="submit"
// //                     disabled={isSubmitting}
// //                     className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
// //                     whileHover={{ scale: 1.02, y: -2 }}
// //                     whileTap={{ scale: 0.98 }}
// //                   >
// //                     {isSubmitting ? (
// //                       <span className="flex items-center justify-center gap-2">
// //                         <motion.div
// //                           className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
// //                           animate={{ rotate: 360 }}
// //                           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
// //                         />
// //                         Sending...
// //                       </span>
// //                     ) : (
// //                       <span className="flex items-center justify-center gap-2">
// //                         <span>🚀</span>
// //                         Send Message
// //                       </span>
// //                     )}
// //                   </motion.button>
// //                 </div>
// //               </div>
// //             </motion.form>
// //           </div>
// //         </motion.div>
// //       </div>
// //     </section>
// //   );
// // };

// export default Contact;
