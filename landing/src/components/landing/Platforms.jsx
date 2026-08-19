import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, useReducedMotion, viewportOnce } from '../../utils/motion';
import styles from './Platforms.module.css';

var PLATFORMS = [
  { name: 'macOS', label: 'Native desktop', href: 'downloads/Leaflyte.dmg' },
  { name: 'Windows', label: 'Desktop app', href: 'downloads/Leaflyte-setup.exe' },
  { name: 'Linux', label: 'AppImage & .deb', href: '#get-started' },
];

function Platforms() {
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
          Works on your desktop
        </motion.p>
        <motion.h2
          className={styles.title}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={viewportOnce}
          variants={fadeUp}
        >
          Mac, Windows, and Linux
        </motion.h2>
      </div>

      <motion.ul
        className={styles.row}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={viewportOnce}
        variants={staggerContainer}
      >
        {PLATFORMS.map(function (platform) {
          return (
            <motion.li key={platform.name} variants={fadeUp}>
              <motion.a
                className={styles.logoCard}
                href={platform.href}
                {...(platform.href.indexOf('http') === 0
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : { download: true })}
                whileHover={{ y: -6, boxShadow: '0 16px 36px rgba(36, 53, 40, 0.14)' }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              >
                <span className={styles.logoMark} aria-hidden="true">
                  {platform.name.charAt(0)}
                </span>
                <strong>{platform.name}</strong>
                <span className={styles.label}>{platform.label}</span>
              </motion.a>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}

export default Platforms;
