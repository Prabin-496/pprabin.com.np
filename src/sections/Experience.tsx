import { motion } from 'framer-motion';
import { Briefcase, MapPin } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { workExperience } from '../content/portfolio';

export default function Experience() {
  return (
    <section id="experience" className="section">
      <div className="shell">
        <SectionHeader
          eyebrow="Experience"
          title="Where I've worked"
          lead="Most recent first. Each role lists the concrete work, not just the job title."
        />

        <div className="mt-12 space-y-6">
          {workExperience.map((job, i) => (
            <motion.article
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="card p-6 sm:p-8"
              style={i === 0 ? { borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)' } : undefined}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span
                    className="grid h-11 w-11 flex-none place-items-center rounded-xl"
                    style={{
                      background: i === 0 ? 'var(--accent-soft)' : 'var(--surface-2)',
                      color: i === 0 ? 'var(--accent)' : 'var(--ink-soft)',
                    }}
                  >
                    <Briefcase className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--ink)' }}>
                      {job.position}
                    </h3>
                    <p className="mt-1 text-sm font-medium" style={{ color: 'var(--accent)' }}>
                      {job.company}
                    </p>
                  </div>
                </div>

                <div className="text-right text-sm" style={{ color: 'var(--muted)' }}>
                  <p className="font-medium">{job.period}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.location}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                {job.description}
              </p>

              <ul className="mt-5 space-y-2.5">
                {job.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                    <span
                      className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full"
                      style={{ background: 'var(--accent)' }}
                      aria-hidden
                    />
                    {highlight}
                  </li>
                ))}
              </ul>

              <ul className="mt-6 flex flex-wrap gap-2">
                {job.technologies.map((tech) => (
                  <li key={tech} className="tag">{tech}</li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
