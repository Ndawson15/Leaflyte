import React, { useEffect, useState } from 'react';
import styles from './NavBar.module.css';

function NavBar() {
  var scrolled = useState(false);
  var isScrolled = scrolled[0];
  var setScrolled = scrolled[1];

  useEffect(function () {
    function onScroll() {
      setScrolled(window.scrollY > 48);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return function () {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header className={styles.header + (isScrolled ? ' ' + styles.scrolled : '')}>
      <div className={styles.inner}>
        <a className={styles.brand} href="/" aria-label="Leaflyte home">
          <img src="/assets/leaflyte.png" width="28" height="28" alt="" />
          <span>Leaflyte</span>
        </a>
      </div>
    </header>
  );
}

export default NavBar;
