import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp, useReducedMotion, viewportOnce } from '../../utils/motion';
import styles from './CtaBand.module.css';

function CtaBand() {
  var reduced = useReducedMotion();

  return (
    <section className={styles.section} id="pricing">
      <motion.div
        className={styles.band}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={viewportOnce}
        variants={fadeUp}
      >
        <div className={styles.copy}>
          <h2>Start free. Stay in control.</h2>
          <p>
            Leaflyte is free to download. Pick a vault folder on your machine and start writing
            in minutes.
          </p>
        </div>

        <div className={styles.actions}>
          <motion.a
            className={styles.btnPrimary}
            href="downloads/Leaflyte.dmg"
            download
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          >
            Download for Mac
          </motion.a>
          <motion.a
            className={styles.btnGhost}
            href="downloads/Leaflyte-setup.exe"
            download
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          >
            Download for Windows
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}

export default CtaBand;
