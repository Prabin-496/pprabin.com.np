import { motion } from 'framer-motion';
import { GraduationCap, Award, Languages as LanguagesIcon } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { education, certifications, languages } from '../content/portfolio';

export default function Education() {
  return (
    <section id="education" className="section">
      <div className="shell">
        <SectionHeader
          eyebrow="Background"
          title="Education, certifications & languages"
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45 }}
            className="space-y-5"
          >
            {education.map((item) => (
              <article key={item.id} className="card p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <span
                    className="grid h-11 w-11 flex-none place-items-center rounded-xl"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                        {item.degree}
                      </h3>
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>{item.period}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium" style={{ color: 'var(--accent)' }}>
                      {item.institution}
                    </p>
                    <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>{item.location}</p>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                      {item.focus}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-semibold" style={{ color: 'var(--ink)' }}>
                <Award className="h-4 w-4" style={{ color: 'var(--accent)' }} /> Certifications
              </h3>
              <ul className="mt-4 space-y-2.5">
                {certifications.map((cert) => (
                  <li key={cert} className="flex gap-3 text-sm" style={{ color: 'var(--ink-soft)' }}>
                    <span
                      className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full"
                      style={{ background: 'var(--accent)' }}
                      aria-hidden
                    />
                    {cert}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-semibold" style={{ color: 'var(--ink)' }}>
                <LanguagesIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} /> Languages
              </h3>
              <ul className="mt-4 space-y-3">
                {languages.map((lang) => (
                  <li key={lang.name}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{lang.name}</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{lang.level}</p>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
