import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Github, X } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { projects, projectNarratives, PLACEHOLDER_IMAGE } from '../content/portfolio';

const INITIAL_COUNT = 3;

export default function Projects() {
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const visible = showAll ? projects : projects.slice(0, INITIAL_COUNT);
  const openProject = projects.find((p) => p.id === openId) ?? null;
  const narrative = openId ? projectNarratives[openId] : null;

  return (
    <section id="projects" className="section">
      <div className="shell">
        <SectionHeader
          eyebrow="Projects"
          title="Selected work"
          lead="Production sites and applications. Open any project for the problem, the approach, and the outcome."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project, i) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
              className="card card-hover group flex flex-col overflow-hidden"
            >
              <div className="relative aspect-[16/10] overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                <img
                  src={project.image}
                  alt={`${project.title} screenshot`}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                  }}
                />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                  {project.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                  {project.description}
                </p>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {project.technologies.slice(0, 4).map((tech) => (
                    <li key={tech} className="tag">{tech}</li>
                  ))}
                  {project.technologies.length > 4 ? (
                    <li className="tag">+{project.technologies.length - 4}</li>
                  ) : null}
                </ul>

                <div className="mt-5 flex items-center gap-4 text-sm">
                  <button
                    type="button"
                    onClick={() => setOpenId(project.id)}
                    className="font-semibold link-underline"
                  >
                    Case study
                  </button>
                  <a
                    href={project.liveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5"
                    style={{ color: 'var(--muted)' }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Live
                  </a>
                  <a
                    href={project.githubLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5"
                    style={{ color: 'var(--muted)' }}
                  >
                    <Github className="h-3.5 w-3.5" /> Code
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {projects.length > INITIAL_COUNT ? (
          <div className="mt-10 flex justify-center">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show fewer' : `Show all ${projects.length} projects`}
            </button>
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {openProject && narrative ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] grid place-items-center p-4"
            style={{ background: 'rgba(4, 7, 14, 0.78)', backdropFilter: 'blur(6px)' }}
            onClick={() => setOpenId(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`${openProject.title} case study`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="card max-h-[86vh] w-full max-w-3xl overflow-y-auto"
            >
              <div
                className="sticky top-0 flex items-start justify-between gap-4 p-6 pb-4"
                style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}
              >
                <div>
                  <h3 className="font-display text-2xl font-semibold">{openProject.title}</h3>
                  <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{openProject.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  className="grid h-9 w-9 flex-none place-items-center rounded-lg"
                  style={{ border: '1px solid var(--line)', color: 'var(--ink-soft)' }}
                  aria-label="Close case study"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-7 p-6 pt-5">
                <Block title="Problem" items={narrative.problem} />
                <Block title="Approach" items={narrative.solution} />
                <Block title="Result" items={narrative.result} />

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Key features
                  </h4>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {narrative.features.map((feature) => (
                      <li key={feature} className="tag tag-accent">{feature}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Stack
                  </h4>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {openProject.technologies.map((tech) => (
                      <li key={tech} className="tag">{tech}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <a href={openProject.liveLink} target="_blank" rel="noreferrer" className="btn btn-primary">
                    <ExternalLink className="h-4 w-4" /> Visit site
                  </a>
                  <a href={openProject.githubLink} target="_blank" rel="noreferrer" className="btn btn-secondary">
                    <Github className="h-4 w-4" /> GitHub
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
        {title}
      </h4>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full" style={{ background: 'var(--accent)' }} aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
