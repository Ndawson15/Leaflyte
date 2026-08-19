import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp, useReducedMotion, viewportOnce } from '../../utils/motion';
import styles from './ProductShowcase.module.css';

function ProductShowcase() {
  var reduced = useReducedMotion();

  var reveal = reduced
    ? {}
    : {
        initial: { clipPath: 'inset(12% 8% 12% 8% round 24px)', opacity: 0.4 },
        whileInView: { clipPath: 'inset(0% 0% 0% 0% round 24px)', opacity: 1 },
        viewport: viewportOnce,
        transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <section className={styles.section} id="demo">
      <div className={styles.header}>
        <motion.p
          className={styles.eyebrow}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={viewportOnce}
          variants={fadeUp}
        >
          Live preview
        </motion.p>
        <motion.h2
          className={styles.title}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={viewportOnce}
          variants={fadeUp}
        >
          AI over your vault — locally, when you want it
        </motion.h2>
        <motion.p
          className={styles.lead}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={viewportOnce}
          variants={fadeUp}
        >
          Connect Ollama, LM Studio, or any OpenAI-compatible endpoint. Your notes stay on your
          machine unless you choose a cloud model.
        </motion.p>
      </div>

      <motion.div className={styles.frame} {...reveal}>
        <img
          src="/assets/ai-screenshot.png"
          alt="Leaflyte AI panel answering questions using notes from the open vault"
          width="1400"
          height="900"
        />
      </motion.div>
    </section>
  );
}

export default ProductShowcase;
