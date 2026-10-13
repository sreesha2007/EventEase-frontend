
import { useState } from "react";
import "./App.css";

import CustomerAuth from "./pages/CustomerAuth";
import CustomerDashboard from "./pages/CustomerDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const services = [
  {
    name: "Photography",
    description: "Capture every beautiful moment",
    image:
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80",
    icon: "📸",
  },
  {
    name: "Catering",
    description: "Delicious food for every occasion",
    image:
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80",
    icon: "🍽️",
  },
  {
    name: "Makeup Artists",
    description: "Look stunning on your special day",
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=80",
    icon: "💄",
  },
  {
    name: "Decoration",
    description: "Beautiful spaces, unforgettable events",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80",
    icon: "🌸",
  },
];

function getSavedCustomer() {
  try {
    const savedCustomer = localStorage.getItem("eventease_customer");
    return savedCustomer ? JSON.parse(savedCustomer) : null;
  } catch {
    return null;
  }
}

function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [customer, setCustomer] = useState(getSavedCustomer);

  function handleLogin(customerData) {
    if (!customerData) return;

    setCustomer(customerData);

    try {
      localStorage.setItem(
        "eventease_customer",
        JSON.stringify(customerData)
      );
    } catch (error) {
      console.error("Unable to save login session:", error);
    }

    setShowAuth(false);
  }

  function handleLogout() {
    setCustomer(null);
    setShowAuth(true);

    try {
      localStorage.removeItem("eventease_customer");
    } catch (error) {
      console.error("Unable to clear login session:", error);
    }
  }

  // Admin dashboard
  if (
    customer?.role === "ADMIN" ||
    customer?.role === "Admin"
  ) {
    return (
      <AdminDashboard
        admin={customer}
        onLogout={handleLogout}
      />
    );
  }

  // Service provider dashboard
  if (
    customer?.role === "SERVICE_PROVIDER" ||
    customer?.role === "Service Provider"
  ) {
    return (
      <ProviderDashboard
        provider={customer}
        onLogout={handleLogout}
      />
    );
  }

  // Customer dashboard
  if (customer) {
    return (
      <CustomerDashboard
        customer={customer}
        onLogout={handleLogout}
      />
    );
  }

  // Login and registration page
  if (showAuth) {
    return (
      <CustomerAuth
        onBack={() => setShowAuth(false)}
        onLogin={handleLogin}
      />
    );
  }

  // Public homepage
  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="#home">
          <span className="logo-icon">✦</span> EventEase
        </a>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#about">About Us</a>
        </nav>

        <div className="nav-actions">
          <button
            className="login-btn"
            onClick={() => setShowAuth(true)}
          >
            Sign In
          </button>

          <button
            className="register-btn"
            onClick={() => setShowAuth(true)}
          >
            Get Started <span>→</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              MAKE EVERY MOMENT SPECIAL
            </div>

            <h1>
              Your perfect event
              <br />
              starts <span>here.</span>
            </h1>

            <p className="hero-description">
              Discover trusted professionals for every celebration.
              From stunning photography to delicious catering, find
              everything you need in one place.
            </p>

            <div className="hero-actions">
              <a href="#services" className="primary-btn">
                Explore Services <span>→</span>
              </a>

              <a href="#about" className="secondary-btn">
                Discover EventEase
              </a>
            </div>

            <div className="hero-trust">
              <div className="trust-icon">✓</div>
              <p>
                Find the right professionals for your special day.
              </p>
            </div>
          </div>

          <div className="hero-visual">
            <img
              className="hero-image"
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1100&q=85"
              alt="Beautifully arranged wedding celebration"
            />

            <div className="floating-card">
              <span className="floating-icon">✦</span>
              <div>
                <strong>Every detail matters</strong>
                <p>Your celebration, your way.</p>
              </div>
            </div>

            <div className="image-decoration" />
          </div>
        </section>

        <section className="services-section" id="services">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXPLORE OUR SERVICES</p>

              <h2>
                <span className="dark-heading-text">
                  Everything you need, all in one place.
                </span>
              </h2>

              <p className="section-description">
                Meet talented professionals who make your celebrations special.
              </p>
            </div>

            <a href="#services" className="view-all">
              Explore all services <span>→</span>
            </a>
          </div>

          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card" key={service.name}>
                <div className="service-image-wrap">
                  <img src={service.image} alt={service.name} />
                  <span className="service-icon">
                    {service.icon}
                  </span>
                </div>

                <div className="service-info">
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>

                  <button
                    type="button"
                    className="service-explore-button"
                    onClick={() => setShowAuth(true)}
                    aria-label={`Sign in to explore ${service.name}`}
                  >
                    Explore <span>↗</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section" id="about">
          <div>
            <p className="eyebrow">WHY EVENTEASE?</p>

            <h2>
              Less planning stress.
              <br />
              <span>More moments to remember.</span>
            </h2>
          </div>

          <p>
            One platform to discover event services, connect with
            professionals, and organize your next celebration with confidence.
          </p>
        </section>
      </main>

      <footer className="footer">
        <a className="logo footer-logo" href="#home">
          <span className="logo-icon">✦</span> EventEase
        </a>

        <p>Making every celebration memorable.</p>
        <span>© 2026 EventEase</span>
      </footer>
    </div>
  );
}

export default App;
