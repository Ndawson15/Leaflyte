import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp, useReducedMotion, viewportOnce } from '../../utils/motion';
import styles from './Footer.module.css';

var PRODUCT_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Downloads', href: '#get-started' },
];

var PLATFORM_LINKS = [
  { label: 'macOS', href: 'downloads/Leaflyte.dmg' },
  { label: 'Windows', href: 'downloads/Leaflyte-setup.exe' },
  { label: 'Linux', href: '#get-started' },
];

var USE_CASE_LINKS = [
  { label: 'Developers', href: '#features' },
  { label: 'Organizers', href: '#how-it-works' },
  { label: 'Privacy', href: '#pricing' },
  { label: 'Teams', href: '#features' },
];

function Footer() {
  var reduced = useReducedMotion();
  var year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <motion.div
        className={styles.inner}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={viewportOnce}
        variants={fadeUp}
      >
        <div className={styles.wordmark}>
          <img src="/assets/leaflyte.png" width="40" height="40" alt="" />
          <span>Leaflyte</span>
        </div>

        <div className={styles.columns}>
          <div>
            <h3>Product</h3>
            <ul>
              {PRODUCT_LINKS.map(function (link) {
                return (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h3>Platforms</h3>
            <ul>
              {PLATFORM_LINKS.map(function (link) {
                return (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h3>Use cases</h3>
            <ul>
              {USE_CASE_LINKS.map(function (link) {
                return (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <p className={styles.copy}>
          © {year} Leaflyte. Your notes, your files.
        </p>
      </motion.div>
    </footer>
  );
}

export default Footer;
