import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, useReducedMotion, viewportOnce } from '../../utils/motion';
import styles from './DesignedFor.module.css';

var AUDIENCES = [
  {
    id: 'developers',
    title: 'Developers',
    body: 'Capture snippets from VS Code, preview GFM with syntax highlighting, and search your vault with path and regex filters.',
    active: true,
  },
  {
    id: 'privacy',
    title: 'Privacy-conscious users',
    body: 'Everything runs locally on your machine. Optional local LLM via Ollama or LM Studio — no cloud inference required.',
  },
  {
    id: 'organizers',
    title: 'Organized thinkers',
    body: 'Plain files you can snapshot, back up, or sync with whatever tools you already use — no cloud account required.',
  },
  {
    id: 'teams',
    title: 'Small teams',
    body: 'Point Leaflyte at a shared folder. Markdown files play nicely with git, Dropbox, iCloud, or whatever sync stack you already trust.',
  },
];

function DesignedFor() {
  var reduced = useReducedMotion();
  var activeState = useState('developers');
  var activeId = activeState[0];
  var setActiveId = activeState[1];

  return (
    <section className={styles.section} id="features">
      <div className={styles.header}>
        <motion.p
          className={styles.eyebrow}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={viewportOnce}
          variants={fadeUp}
        >
          Designed for
        </motion.p>
        <motion.h2
          className={styles.title}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={viewportOnce}
          variants={fadeUp}
        >
          People who treat notes like infrastructure
        </motion.h2>
      </div>

      <motion.div
        className={styles.grid}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={viewportOnce}
        variants={staggerContainer}
      >
        {AUDIENCES.map(function (item) {
          var isActive = activeId === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              className={
                styles.card +
                (isActive ? ' ' + styles.active : '') +
                (!isActive ? ' ' + styles.dimmed : '')
              }
              variants={fadeUp}
              onMouseEnter={function () {
                setActiveId(item.id);
              }}
              onFocus={function () {
                setActiveId(item.id);
              }}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            >
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}

export default DesignedFor;
