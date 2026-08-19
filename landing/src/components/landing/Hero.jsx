import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fadeUp, useReducedMotion } from '../../utils/motion';
import styles from './Hero.module.css';

function Hero(props) {
  var reduced = useReducedMotion();
  var frameRef = useRef(null);

  var onMouseMove = useCallback(function (event) {
    if (reduced || !frameRef.current) return;

    var rect = frameRef.current.getBoundingClientRect();
    var x = (event.clientX - rect.left) / rect.width - 0.5;
    var y = (event.clientY - rect.top) / rect.height - 0.5;

    frameRef.current.style.setProperty('--tilt-x', String(-y * 6));
    frameRef.current.style.setProperty('--tilt-y', String(x * 8));
  }, [reduced]);

  var onMouseLeave = useCallback(function () {
    if (!frameRef.current) return;
    frameRef.current.style.setProperty('--tilt-x', '0');
    frameRef.current.style.setProperty('--tilt-y', '0');
  }, []);

  var badgeProps = reduced
    ? { initial: false, animate: fadeUp.visible }
    : { initial: 'hidden', animate: 'visible', variants: fadeUp, transition: { delay: 0.05 } };

  var headlineProps = reduced
    ? { initial: false, animate: fadeUp.visible }
    : { initial: 'hidden', animate: 'visible', variants: fadeUp, transition: { delay: 0.12 } };

  var subProps = reduced
    ? { initial: false, animate: fadeUp.visible }
    : { initial: 'hidden', animate: 'visible', variants: fadeUp, transition: { delay: 0.2 } };

  var ctaProps = reduced
    ? { initial: false, animate: fadeUp.visible }
    : { initial: 'hidden', animate: 'visible', variants: fadeUp, transition: { delay: 0.28 } };

  var mockupProps = reduced
    ? { initial: false, animate: fadeUp.visible }
    : { initial: 'hidden', animate: 'visible', variants: fadeUp, transition: { delay: 0.36, duration: 0.85 } };

  return (
    <section className={styles.hero} id="get-started">
      <div className={styles.inner}>
        <motion.p className={styles.badge} {...badgeProps}>
          Open source · Local-first · Your data stays yours
        </motion.p>

        <motion.h1 className={styles.headline} {...headlineProps}>
          Notes that live on
          <br />
          <span className={styles.highlight}>your hardware</span>
        </motion.h1>

        <motion.p className={styles.subhead} {...subProps}>
          Leaflyte is a local-first vault for markdown, code, and research. Install the desktop app,
          edit your notes, and keep every file as plain text you can grep, sync, or ship.
        </motion.p>

        <motion.div className={styles.ctas} {...ctaProps}>
          <motion.a
            className={styles.btnPrimary}
            href="downloads/Leaflyte.dmg"
            download
            whileHover={{ scale: 1.03, y: -2 }}
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
            Download for Windows (ARM64)
          </motion.a>
        </motion.div>

        <motion.div
          className={styles.mockupWrap}
          {...mockupProps}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <div
            ref={frameRef}
            className={styles.mockup + (reduced ? ' ' + styles.noFloat : '')}
          >
            <img
              src="/assets/app-screenshot.png"
              alt="Leaflyte desktop app showing a markdown note beside a file tree and editor"
              width="1280"
              height="800"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
