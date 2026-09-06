import { motion } from 'framer-motion';
import { Cloud, Github, Code, Image as ImageIcon, Sparkles } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { skills } from '../content/portfolio';

const ICONS: Record<string, typeof Cloud> = {
  cloud: Cloud,
  git: Github,
  code: Code,
  design: ImageIcon,
  spark: Sparkles,
};

export default function Skills() {
  return (
    <section id="skills" className="section">
      <div className="shell">
        <SectionHeader
          eyebrow="Skills"
          title="What I work with"
          lead="Ordered by where my focus sits today — cloud and infrastructure first, with the software foundation that supports it."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {skills.map((group, i) => {
            const Icon = ICONS[group.icon] ?? Code;
            const isPrimary = i === 0;
            return (
              <motion.article
                key={group.category}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className={`card card-hover p-6 ${isPrimary ? 'lg:col-span-2' : ''}`}
                style={isPrimary ? { borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)' } : undefined}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-lg"
                    style={{
                      background: isPrimary ? 'var(--accent-soft)' : 'var(--surface-2)',
                      color: isPrimary ? 'var(--accent)' : 'var(--ink-soft)',
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold" style={{ color: 'var(--ink)' }}>{group.category}</h3>
                </div>

                <ul className="mt-5 flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <li key={skill} className={isPrimary ? 'tag tag-accent' : 'tag'}>
                      {skill}
                    </li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
