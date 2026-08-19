import { useEffect, useState } from 'react';

export const EASE_OUT = [0.22, 1, 0.36, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: EASE_OUT },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.65, ease: EASE_OUT },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

export const viewportOnce = {
  once: true,
  amount: 0.2,
  margin: '0px 0px -8% 0px',
};

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(function () {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);

    function onChange(event) {
      setReduced(event.matches);
    }

    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
      return function () {
        mq.removeEventListener('change', onChange);
      };
    }

    mq.addListener(onChange);
    return function () {
      mq.removeListener(onChange);
    };
  }, []);

  return reduced;
}

export function motionProps(reduced, variant) {
  if (reduced) {
    return {
      initial: false,
      animate: variant.visible,
    };
  }

  return {
    initial: 'hidden',
    whileInView: 'visible',
    viewport: viewportOnce,
    variants: variant,
  };
}
