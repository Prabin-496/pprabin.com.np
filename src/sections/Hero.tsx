import { motion } from 'framer-motion';
import { ArrowRight, Github, Linkedin, Mail, MapPin, FileText } from 'lucide-react';
import { profile, heroStats, skills } from '../content/portfolio';
import { useLanguage } from '../i18n/LanguageContext';

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Hero() {
  const { t } = useLanguage();
  // Lead with the infrastructure stack — it is what the role search is about.
  const primaryStack = skills[0].skills.slice(0, 6);

  return (
    <section id="home" className="section relative overflow-hidden pt-32 sm:pt-40">
      <div className="shell">
        <motion.p variants={fade} custom={0} initial="hidden" animate="show">
          <span className="status-pill">
            <span className="status-dot" />
            {t.hero.availability}
          </span>
        </motion.p>

        <motion.h1
          variants={fade}
          custom={1}
          initial="hidden"
          animate="show"
          className="font-display mt-7 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
        >
          {profile.name}
        </motion.h1>

        <motion.p
          variants={fade}
          custom={2}
          initial="hidden"
          animate="show"
          className="mt-4 text-xl font-medium sm:text-2xl"
        >
          <span className="gradient-text">{t.hero.role}</span>
        </motion.p>

        <motion.p
          variants={fade}
          custom={3}
          initial="hidden"
          animate="show"
          className="mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
          style={{ color: 'var(--ink-soft)' }}
        >
          {t.hero.summary}
        </motion.p>

        <motion.div
          variants={fade}
          custom={4}
          initial="hidden"
          animate="show"
          className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
          style={{ color: 'var(--muted)' }}
        >
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {profile.location}
          </span>
          <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1.5 link-underline">
            <Mail className="h-4 w-4" /> {profile.email}
          </a>
        </motion.div>

        <motion.div
          variants={fade}
          custom={5}
          initial="hidden"
          animate="show"
          className="no-print mt-9 flex flex-wrap gap-3"
        >
          <a href="#contact" className="btn btn-primary">
            {t.hero.getInTouch} <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#experience" className="btn btn-secondary">
            <FileText className="h-4 w-4" /> {t.hero.viewExperience}
          </a>
          <a href={profile.links.github} target="_blank" rel="noreferrer" className="btn btn-secondary">
            <Github className="h-4 w-4" /> GitHub
          </a>
          <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="btn btn-secondary">
            <Linkedin className="h-4 w-4" /> LinkedIn
          </a>
        </motion.div>

        <motion.ul
          variants={fade}
          custom={6}
          initial="hidden"
          animate="show"
          className="mt-10 flex flex-wrap gap-2"
          aria-label="Core infrastructure stack"
        >
          {primaryStack.map((item) => (
            <li key={item} className="tag tag-accent">{item}</li>
          ))}
        </motion.ul>

        <motion.dl
          variants={fade}
          custom={7}
          initial="hidden"
          animate="show"
          className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl sm:grid-cols-3"
          style={{ background: 'var(--line)', border: '1px solid var(--line)' }}
        >
          {heroStats.map((stat) => (
            <div key={stat.label} className="px-6 py-6" style={{ background: 'var(--surface)' }}>
              <dt className="font-display text-3xl font-semibold" style={{ color: 'var(--ink)' }}>
                {stat.value}
              </dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{stat.label}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
