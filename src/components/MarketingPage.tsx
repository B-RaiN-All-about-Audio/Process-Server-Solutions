import React from 'react';
import { BrandLogo } from './BrandLogo';

interface MarketingPageProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onSelectPackage?: (packageId: string) => void;
}

export const PACKAGES = [
  { id: 'silver', name: 'Silver', price: '$15 Monthly', volume: 'Up to 100 orders/month', cta: 'Sign Up' },
  { id: 'gold', name: 'Gold', price: '$40 Monthly', volume: 'Up to 500 orders/month', cta: 'Sign Up', featured: true },
  { id: 'platinum', name: 'Platinum', price: '$100 Monthly', volume: 'Up to 1000 orders/month', cta: 'Sign Up' },
  { id: 'diamond', name: 'Diamond', price: 'Yearly — $1000 paid up front', volume: 'Up to 1200 orders/month', cta: 'Sign Up' }
];

export const MarketingPage: React.FC<MarketingPageProps> = ({ onOpenAuth, onSelectPackage }) => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mkt-shell">
      <div className="mkt-glow mkt-glow--a" aria-hidden="true" />
      <div className="mkt-glow mkt-glow--b" aria-hidden="true" />

      {/* Navigation Header */}
      <header className="mkt-nav">
        <BrandLogo layout="banner" size="md" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <nav className="mkt-nav__links" aria-label="Marketing">
          <button type="button" onClick={() => scrollTo('software')}>
            Our Software
          </button>
          <button type="button" onClick={() => scrollTo('demo')}>
            Demo
          </button>
          <button type="button" onClick={() => scrollTo('pricing')}>
            Pricing
          </button>
          <button type="button" onClick={() => scrollTo('contact')}>
            Contact
          </button>
        </nav>
        <div className="mkt-nav__cta">
          <button type="button" className="ghost-btn" onClick={() => onOpenAuth('signin')}>
            Login
          </button>
          <button type="button" className="primary" onClick={() => onOpenAuth('signup')}>
            Free Trial
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mkt-hero">
        <div className="mkt-hero__copy">
          <p className="eyebrow mint-glow-text">Process Servers Solution</p>
          <h1>
            Online process server software to{' '}
            <span className="gradient-text">streamline your process service business</span>
          </h1>
          <p className="mkt-lead">
            One web portal for order tracking, real-time server updates, email notifications, mobile field uploads, affidavit templates with eSignature, and online billing — built for agencies that need speed and proof.
          </p>
          <div className="mkt-hero__actions">
            <button
              type="button"
              className="primary cta pulse-cta"
              onClick={() => onOpenAuth('signup')}
            >
              Start 15-Day Free Trial →
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => onOpenAuth('signin')}
            >
              Sign in
            </button>
          </div>
          <p className="mkt-trust">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M9.2 16.6 4.8 12.2l1.4-1.4 3 3 8-8 1.4 1.4z" />
            </svg>{' '}
            No credit card required · Full access for 15 days
          </p>
        </div>

        {/* Live Operations Preview Card */}
        <div className="mkt-hero__visual" id="demo">
          <div className="mkt-preview-card">
            <div className="mkt-preview-card__bar">
              <span />
              <span />
              <span />
              <b>Live operations preview</b>
            </div>
            <ul>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M9.2 16.6 4.8 12.2l1.4-1.4 3 3 8-8 1.4 1.4z" />
                </svg>
                Order #4821 · Attempt logged with photo
              </li>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M9.2 16.6 4.8 12.2l1.4-1.4 3 3 8-8 1.4 1.4z" />
                </svg>
                Affidavit of Service · eSigned PDF ready
              </li>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M9.2 16.6 4.8 12.2l1.4-1.4 3 3 8-8 1.4 1.4z" />
                </svg>
                Invoice auto-generated on close
              </li>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M9.2 16.6 4.8 12.2l1.4-1.4 3 3 8-8 1.4 1.4z" />
                </svg>
                Client email notification sent
              </li>
            </ul>
            <div className="mkt-preview-card__footer">
              Mobile field updates · Configuration roles · Multi-department orders
            </div>
          </div>
        </div>
      </section>

      {/* Our Software Section */}
      <section className="mkt-section mkt-flyer" id="software">
        <div className="mkt-section__head">
          <p className="eyebrow">Our Software</p>
          <h2>Process server software for your process service company</h2>
        </div>
        <div className="mkt-prose">
          <p className="mkt-prose__drop">
            Process server software provides your process service company with online order tracking, real time server updates, e-mailing tracking and billing. Our process server software comes complete with access to a mobile site providing a simplified interface to allow process servers to update orders status and provide pictures or other documents from the field as needed. Notifying customers via email is simple through our easy to use order tracking system. Our process server software allows you to configure roles to restrict access to certain data. In addition, you can add commonly used process server updates to allow the servers to simply click a button in the field and update that status of the order.
          </p>
          <p>
            Our process server software allows you to add affidavit templates so that creating documents for court is efficient and can create both word and PDF files to provide to your customer. Our package comes with several standard affidavit templates but you can add new templates or customize our standard templates to help increase your productivity.
          </p>
          <p>
            Our process server software simplifies your billing process with online invoicing and statements. Save time by automatically invoicing orders as they are closed and if services or fees are added the invoice is automatically updated. When customer statements are created, a PDF file is stored online under your customer's account and can automatically emailed to your customer without any additional steps. To help your customers, we also provide a customer specific CSV/Excel file that can be generated to help your customer import into their accounting software.
          </p>
        </div>

        <aside className="mkt-feature-spotlight" aria-label="Feature list">
          <p>
            Our Process Server Software feature list is always expanding. Create documents and save them as PDFs or documents (DOCs). With our eSignature feature you can create affidavits with signatures already included. Automatically generate invoices, send server updates with attachment, email your customer utilizing custom email templates and view order history. Centralize your company's order tracking by adding additional order departments/templates
          </p>
        </aside>

        <div className="mkt-prose">
          <p>
            Does your company do more than just process service? Do you provide document research or retrieval? Are you also a courier company? If so, our innovative process server software allows you to create new company departments or order types so that all of your orders are centralized in one place. No needed for additional software, we have a wide range of standard data types that can be collected and if you need additional data fields for your order we can add new types as needed. Our process service software allows you to centralize ALL of your order tracking, no just process service.
          </p>
        </div>

        <p className="mkt-tagline">
          Process server software utilizing an innovative web based portal.
        </p>
      </section>

      {/* Pricing Section */}
      <section className="mkt-section" id="pricing">
        <div className="mkt-section__head">
          <p className="eyebrow">Pricing</p>
          <h2>All packages include a 15-Day Free Trial</h2>
          <p>
            All packages include a 15-Day Free Trial. No need to enter a credit card or payment information when you set up your account.
          </p>
        </div>
        <div className="mkt-pricing mkt-pricing--four">
          {PACKAGES.map((pkg) => (
            <article
              key={pkg.id}
              className={`mkt-price-card ${pkg.featured ? 'featured' : ''} ${pkg.id === 'diamond' ? 'diamond' : ''}`}
            >
              <p className="mkt-price-card__tier">{pkg.name} Package</p>
              <h3>{pkg.volume}</h3>
              <p className="mkt-price">{pkg.price}</p>
              <p className="muted">15-Day Free Trial · No credit card required</p>
              <button
                type="button"
                className={pkg.featured ? 'primary cta' : 'ghost-btn'}
                onClick={() => {
                  onSelectPackage?.(pkg.id);
                  onOpenAuth('signup');
                }}
              >
                {pkg.cta}
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Contact Banner */}
      <section className="mkt-cta-banner" id="contact">
        <div>
          <h2>Ready to modernize process service?</h2>
          <p>
            Join agencies running intake, field proof, affidavits, and billing on Process Servers Solution.
          </p>
        </div>
        <div className="mkt-hero__actions">
          <button
            type="button"
            className="primary cta"
            onClick={() => onOpenAuth('signup')}
          >
            Free Trial
          </button>
          <a
            className="ghost-btn link-btn"
            href="mailto:hello@processserverssolution.com"
          >
            Contact
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="mkt-footer">
        <BrandLogo layout="banner" size="md" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <nav aria-label="Footer">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Home
          </button>
          <button type="button" onClick={() => scrollTo('software')}>
            Our Software
          </button>
          <button type="button" onClick={() => scrollTo('demo')}>
            Demo
          </button>
          <button type="button" onClick={() => scrollTo('pricing')}>
            Pricing
          </button>
          <button type="button" onClick={() => onOpenAuth('signup')}>
            Free Trial
          </button>
          <a href="mailto:hello@processserverssolution.com">
            Contact
          </a>
          <button type="button" onClick={() => onOpenAuth('signin')}>
            Login
          </button>
        </nav>
        <small>
          © {new Date().getFullYear()} Process Servers Solution · www.processserverssolution.com
        </small>
      </footer>
    </div>
  );
};
