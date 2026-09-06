import { motion } from 'framer-motion';
import { MapPin, Languages as LanguagesIcon, Users, ArrowRight } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { japanReadiness, languages } from '../content/portfolio';

const ICONS = [MapPin, LanguagesIcon, Users];

export default function JapanReadiness() {
  // The language card renders from the shared `languages` list.
  const cards = japanReadiness.cards.map((card, i) =>
    i === 1
      ? { ...card, points: languages.map((l) => `${l.name}: ${l.level}`) }
      : card
  );

  return (
    <section id="japan" className="section">
      <div className="shell">
        <SectionHeader
          eyebrow="Japan"
          title="Japan readiness"
          lead={japanReadiness.intro}
          align="center"
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {cards.map((card, i) => {
            const Icon = ICONS[i] ?? MapPin;
            return (
              <motion.article
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className="card card-hover flex flex-col p-7"
              >
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display mt-5 text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                  {card.label}
                </h3>
                <ul className="mt-4 flex-1 space-y-2.5">
                  {card.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                      <span
                        className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full"
                        style={{ background: 'var(--accent)' }}
                        aria-hidden
                      />
                      {point}
                    </li>
                  ))}
                </ul>

                {i === 2 ? (
                  <a href="#contact" className="btn btn-primary no-print mt-6">
                    Open to Cloud/AWS Roles (Japan) <ArrowRight className="h-4 w-4" />
                  </a>
                ) : null}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
