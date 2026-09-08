import { motion } from 'framer-motion';
import SectionHeader from './SectionHeader';
import identity from '../content/identity.json';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Plain answers to the questions people actually type.
 *
 * This section exists for two audiences at once. Google's FAQPage structured
 * data is only eligible when the same questions and answers are visible on the
 * page, so the schema emitted at build time from `identity.json` and this
 * component are deliberately the same content from the same source. And
 * "Prabin Parajuli" is a shared name — a page that answers "who is Prabin
 * Parajuli" in one direct sentence is far easier for a search engine or a
 * language model to quote than one that only implies it.
 */
export default function FAQ() {
  const { t } = useLanguage();
  // Fall back to the English source when a language has no FAQ translation, so
  // the structured data on the page always has visible text behind it.
  const items = t.faq.length ? t.faq : identity.faq;

  return (
    <section id="faq" className="section">
      <div className="shell">
        <SectionHeader
          eyebrow={t.sections.faq.eyebrow}
          title={t.sections.faq.title}
          lead={identity.shortAnswer}
        />

        <div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {items.map((item, i) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: (i % 2) * 0.05 }}
            >
              <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                {item.q}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                {item.a}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
