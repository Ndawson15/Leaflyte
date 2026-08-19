import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, useReducedMotion, viewportOnce } from '../../utils/motion';
import styles from './ThreeSteps.module.css';

var STEPS = [
  {
    num: '01',
    title: 'Download & open a vault',
    body:
      'Install Leaflyte on Mac or Windows, pick a folder on disk, and start writing. No account required — your vault is just files.',
    visual: 'download',
  },
  {
    num: '02',
    title: 'Write & organize',
    body:
      'Markdown, SQL, TypeScript, and more in Monaco. Wiki links, split preview, vault search with path and regex filters.',
    visual: 'editor',
  },
  {
    num: '03',
    title: 'Own your data',
    body:
      'Every note is a plain file you can back up, rsync, or commit. Export anytime. No vendor lock-in, no surprise shutdowns.',
    visual: 'vault',
  },
];

function StepVisual(props) {
  var type = props.type;

  if (type === 'download') {
    return (
      <div className={styles.terminal} aria-hidden="true">
        <code>1. Download Leaflyte for your OS</code>
        <code>2. Choose a vault folder</code>
        <code>✓ Ready — start writing in Monaco</code>
      </div>
    );
  }

  if (type === 'editor') {
    return (
      <div className={styles.editorMock} aria-hidden="true">
        <div className={styles.editorPane}>
          <span># Sprint notes</span>
          <span>- [ ] Ship landing page</span>
          <span>- [x] GFM preview</span>
        </div>
        <div className={styles.previewPane}>
          <strong>Sprint notes</strong>
          <ul>
            <li>Ship landing page</li>
            <li>GFM preview</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.vaultMock} aria-hidden="true">
      <div>vault/</div>
      <div>├── notes/</div>
      <div>│   ├── ideas.md</div>
      <div>│   └── roadmap.md</div>
      <div>├── code/</div>
      <div>│   └── query.sql</div>
      <div>└── .leaflyte/</div>
    </div>
  );
}

function ThreeSteps() {
  var reduced = useReducedMotion();

  return (
    <section className={styles.section} id="how-it-works">
      <div className={styles.header}>
        <motion.p
          className={styles.eyebrow}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={viewportOnce}
          variants={fadeUp}
        >
          How it works
        </motion.p>
        <motion.h2
          className={styles.title}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={viewportOnce}
          variants={fadeUp}
        >
          Three steps to a vault you control
        </motion.h2>
      </div>

      <div className={styles.steps}>
        {STEPS.map(function (step, index) {
          var reverse = index % 2 === 1;
          return (
            <motion.article
              key={step.num}
              className={styles.step + (reverse ? ' ' + styles.reverse : '')}
              initial={reduced ? false : 'hidden'}
              whileInView={reduced ? undefined : 'visible'}
              viewport={viewportOnce}
              variants={staggerContainer}
            >
              <motion.div className={styles.copy} variants={fadeUp}>
                <span className={styles.ghostNum} aria-hidden="true">
                  {step.num}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </motion.div>
              <motion.div className={styles.visual} variants={fadeUp}>
                <StepVisual type={step.visual} />
              </motion.div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

export default ThreeSteps;
