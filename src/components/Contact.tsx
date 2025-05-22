import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaLinkedin, FaGithub, FaEnvelope } from 'react-icons/fa'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log(formData)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <section id="contact" className="section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Get in Touch
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Contact Information</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Feel free to reach out to me for any opportunities or just to say
                hello!
              </p>
              <div className="space-y-4">
                <motion.a
                  href="mailto:your.email@example.com"
                  className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                  whileHover={{ x: 5 }}
                >
                  <FaEnvelope className="text-xl" />
                  your.email@example.com
                </motion.a>
                <motion.a
                  href="https://www.linkedin.com/in/prabin-parajuli-techie496/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                  whileHover={{ x: 5 }}
                >
                  <FaLinkedin className="text-xl" />
                  LinkedIn Profile
                </motion.a>
                <motion.a
                  href="https://github.com/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                  whileHover={{ x: 5 }}
                >
                  <FaGithub className="text-xl" />
                  GitHub Profile
                </motion.a>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg glass focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg glass focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium mb-2"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg glass focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                ></textarea>
              </div>
              <motion.button
                type="submit"
                className="btn btn-primary w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Send Message
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Contact 