import { motion } from 'framer-motion';
import { Play, Video } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { videoProjects, PLACEHOLDER_IMAGE } from '../content/portfolio';

export default function VideoWork() {
  return (
    <section id="video-editing" className="section">
      <div className="shell">
        <SectionHeader
          eyebrow="Side work"
          title="Video editing"
          lead="A creative side project kept on this portfolio as additional work — short-form content built around hooks, pacing, and retention."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videoProjects.map((video, i) => (
            <motion.a
              key={video.id}
              href={video.videoLink}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
              className="card card-hover group flex flex-col overflow-hidden"
            >
              <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                <img
                  src={video.thumbnail}
                  alt={`${video.title} thumbnail`}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                  }}
                />
                <span
                  className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100"
                  style={{ background: 'var(--scrim)' }}
                >
                  <span
                    className="grid h-14 w-14 place-items-center rounded-full"
                    style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
                  >
                    <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
                  </span>
                </span>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                  {video.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                  {video.description}
                </p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                  <Video className="h-3.5 w-3.5" /> {video.software}
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
