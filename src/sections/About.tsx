import { motion } from 'framer-motion';
import { Cloud, GraduationCap, MapPin } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { aboutPoints, aboutCard, builtHere } from '../content/portfolio';

export default function About() {
  return (
    <section id="about" className="section">
      <div className="shell">
        <SectionHeader
          eyebrow="About"
          title="Infrastructure-first, with a full-stack foundation"
          lead="Where I am now, what I work on daily, and what I bring from the software side."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
          <motion.ul
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {aboutPoints.map((point, i) => (
              <li key={i} className="flex gap-3 text-base leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                <span
                  className="mt-2 h-1.5 w-1.5 flex-none rounded-full"
                  style={{ background: 'var(--accent)' }}
                  aria-hidden
                />
                <span>
                  {point.text}{' '}
                  {point.emphasis ? (
                    <strong style={{ color: 'var(--ink)' }}>{point.emphasis}</strong>
                  ) : null}
                  {point.tail}
                </span>
              </li>
            ))}
          </motion.ul>

          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card p-7"
          >
            <span
              className="grid h-11 w-11 place-items-center rounded-xl"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <Cloud className="h-5 w-5" />
            </span>
            <h3 className="font-display mt-5 text-xl font-semibold">{aboutCard.title}</h3>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              {aboutCard.body}
            </p>

            <div className="rule my-6" />

            <ul className="space-y-2.5 text-sm" style={{ color: 'var(--muted)' }}>
              <li className="flex items-start gap-2">
                <GraduationCap className="mt-0.5 h-4 w-4 flex-none" />
                <span>
                  {aboutCard.lines[0]}
                  <br />
                  {aboutCard.lines[1]}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-none" />
                {aboutCard.lines[2]}
              </li>
            </ul>
          </motion.aside>
        </div>

        {/* Live systems running on this domain — the strongest infra evidence. */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mt-14"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Running on this domain
          </h3>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {builtHere.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="card card-hover group block p-6"
                target="_blank"
                rel="noreferrer"
              >
                <h4 className="font-display text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                  {item.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                  {item.description}
                </p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {item.stack.map((tech) => (
                    <li key={tech} className="tag">{tech}</li>
                  ))}
                </ul>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
