import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, useReducedMotion, viewportOnce } from '../../utils/motion';
import styles from './Testimonials.module.css';

var TESTIMONIALS = [
  {
    quote:
      'I pointed Leaflyte at a folder in iCloud Drive and stopped worrying about export formats. Everything is just markdown and code on disk — exactly how I wanted it.',
    name: 'Alex R.',
    role: 'Indie developer',
  },
  {
    quote:
      'The VS Code capture extension sold me. I highlight code, hit one shortcut, and it lands in my vault as a real file — .ts, .sql, whatever I was editing — not pasted into a markdown note.',
    name: 'Jordan M.',
    role: 'Software engineer',
  },
  {
    quote:
      'Our three-person team shares a vault through git. No new SaaS bill, no permission matrix — just files we already know how to diff and review.',
    name: 'Sam K.',
    role: 'Team lead',
  },
  {
    quote:
      'Hooked up Ollama and asked questions over my notes without sending anything to the cloud. For the first time, AI actually fits how I work.',
    name: 'Taylor P.',
    role: 'Privacy-conscious writer',
  },
];

function Testimonials() {
  var reduced = useReducedMotion();

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <motion.p
          className={styles.eyebrow}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={viewportOnce}
          variants={fadeUp}
        >
          Social proof
        </motion.p>
        <motion.h2
          className={styles.title}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={viewportOnce}
          variants={fadeUp}
        >
          Early adopters, real workflows
        </motion.h2>
      </div>

      <motion.div
        className={styles.track}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={viewportOnce}
        variants={staggerContainer}
      >
        {TESTIMONIALS.map(function (item) {
          return (
            <motion.blockquote
              key={item.name}
              className={styles.card}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            >
              <p>&ldquo;{item.quote}&rdquo;</p>
              <footer>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </footer>
            </motion.blockquote>
          );
        })}
      </motion.div>
    </section>
  );
}

export default Testimonials;
