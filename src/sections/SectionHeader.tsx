import { motion } from 'framer-motion';

type Props = { eyebrow: string; title: string; lead?: string; align?: 'left' | 'center' };

export default function SectionHeader({ eyebrow, title, lead, align = 'left' }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className={align === 'center' ? 'mx-auto max-w-3xl text-center' : ''}
    >
      <p className="eyebrow">
        <span className="rule inline-block h-px w-6" style={{ background: 'var(--accent)' }} aria-hidden />
        {eyebrow}
      </p>
      <h2 className="section-title mt-4">{title}</h2>
      {lead ? <p className={`section-lead ${align === 'center' ? 'mx-auto' : ''}`}>{lead}</p> : null}
    </motion.div>
  );
}
