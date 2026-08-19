import React from 'react';
import styles from './LandingPage.module.css';
import NavBar from './components/landing/NavBar';
import Hero from './components/landing/Hero';
import ThreeSteps from './components/landing/ThreeSteps';
import DesignedFor from './components/landing/DesignedFor';
import Platforms from './components/landing/Platforms';
import ProductShowcase from './components/landing/ProductShowcase';
import Testimonials from './components/landing/Testimonials';
import CtaBand from './components/landing/CtaBand';
import Footer from './components/landing/Footer';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.mesh} aria-hidden="true" />
      <NavBar />
      <main>
        <Hero />
        <ThreeSteps />
        <DesignedFor />
        <Platforms />
        <ProductShowcase />
        <Testimonials />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}
