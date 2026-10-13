
import { useMemo, useState, useEffect } from "react";
import "./CustomerDashboard.css";
import ProviderListing from "./ProviderListing";

const API_URL = "http://localhost:8080/api";

const categories = [
  "All",
  "Photography",
  "Catering",
  "Makeup",
  "Decoration",
];

function formatBooking(booking, services) {
  const service = services.find(
    (item) => Number(item.id) === Number(booking.serviceId)
  );

  const message = booking.message || "";

  const eventType =
    message.match(/Event type:\s*(.*)/i)?.[1]?.split("\n")[0] ||
    "Event";

  const phone =
    message.match(/Contact:\s*(.*)/i)?.[1]?.split("\n")[0] || "";

  const notes =
    message.match(/Details:\s*([\s\S]*)/i)?.[1]?.trim() || "";

  return {
    id: booking.id,
    service: service?.name || "Event service",
    providerName: service?.providerName || "Service Provider",
    category: service?.category || "",
    price: Number(service?.price || 0),
    eventDate: booking.eventDate || "",
    eventType,
    phone,
    location: booking.eventLocation || "",
    notes,
    status: booking.status || "PENDING",
  };
}

export default function CustomerDashboard({ customer, onLogout }) {
  const [activeTab, setActiveTab] = useState("Explore");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [selectedService, setSelectedService] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [providerCategory, setProviderCategory] = useState(null);

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [notice, setNotice] = useState("");

  const [bookingForm, setBookingForm] = useState({
    eventDate: "",
    eventType: "Birthday",
    location: "",
    phone: "",
    notes: "",
  });

  const today = new Date().toLocaleDateString("en-CA");

  // Load service listings from Spring Boot.
  useEffect(() => {
    async function loadServices() {
      try {
        const response = await fetch(`${API_URL}/services`);

        if (!response.ok) {
          throw new Error("Unable to load services from the server.");
        }

        const data = await response.json();

        setServices(
          data.map((service) => ({
            ...service,
            name:
              service.name ||
              service.category ||
              service.title ||
              "Service",
            category:
              service.category || service.name || "Other",
            providerName:
              service.providerName ||
              service.title ||
              "Service Provider",
            description: service.description || "",
            price: Number(service.price || 0),
            image:
              service.image ||
              service.imageUrl ||
              "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=85",
          }))
        );

        setServicesError("");
      } catch (error) {
        setServicesError(
          error.message || "Unable to connect to the server."
        );
      } finally {
        setServicesLoading(false);
      }
    }

    loadServices();
  }, []);

  // Load saved booking requests for the logged-in customer.
  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      if (!customer?.id) {
        setBookings([]);
        setBookingsLoading(false);
        return;
      }

      setBookingsLoading(true);
      setBookingError("");

      try {
        const response = await fetch(
          `${API_URL}/bookings/customer/${customer.id}`
        );

        if (!response.ok) {
          throw new Error("Unable to load your bookings.");
        }

        const data = await response.json();

        if (!cancelled) {
          setBookings(
            data.map((booking) => formatBooking(booking, services))
          );
        }
      } catch (error) {
        if (!cancelled) {
          setBookingError(
            error.message || "Unable to load bookings."
          );
        }
      } finally {
        if (!cancelled) {
          setBookingsLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, [customer?.id, services]);

  const filteredServices = useMemo(() => {
    const searchText = search.toLowerCase();

    return services.filter((service) => {
      const matchesCategory =
        category === "All" || service.category === category;

      const matchesSearch =
        service.name.toLowerCase().includes(searchText) ||
        service.category.toLowerCase().includes(searchText) ||
        service.providerName.toLowerCase().includes(searchText) ||
        service.description.toLowerCase().includes(searchText);

      return matchesCategory && matchesSearch;
    });
  }, [services, category, search]);

  function openBooking(service) {
    setProviderCategory(service);
  }

  function handleBookProvider(service) {
    setSelectedService(service);
    setProviderCategory(null);
    setShowBookingForm(true);
    setBookingError("");

    setBookingForm({
      eventDate: "",
      eventType: "Birthday",
      location: "",
      phone: "",
      notes: "",
    });
  }

  function closeServiceModal() {
    setSelectedService(null);
    setShowBookingForm(false);
    setBookingError("");
  }

  // Submit a booking request to Spring Boot and MySQL.
  async function submitBooking(event) {
    event.preventDefault();

    if (!selectedService || submittingBooking) return;

    if (!customer?.id) {
      setBookingError("Please log in again to submit your booking.");
      return;
    }

    setSubmittingBooking(true);
    setBookingError("");

    try {
      const message = [
        `Event type: ${bookingForm.eventType}`,
        `Contact: ${bookingForm.phone}`,
        bookingForm.notes
          ? `Details: ${bookingForm.notes}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: Number(customer.id),
          serviceId: Number(selectedService.id),
          eventDate: bookingForm.eventDate,
          eventLocation: bookingForm.location,
          message,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || "Failed to submit booking request."
        );
      }

      // Close the form only after the booking is accepted by the backend.
      closeServiceModal();
      setActiveTab("My Bookings");
      setNotice("Your booking request was submitted successfully!");

      // Reload booking history from the database.
      const bookingsResponse = await fetch(
        `${API_URL}/bookings/customer/${customer.id}`
      );

      if (!bookingsResponse.ok) {
        throw new Error(
          "Booking submitted, but could not refresh booking history."
        );
      }

      const data = await bookingsResponse.json();

      setBookings(
        data.map((booking) => formatBooking(booking, services))
      );

      setBookingError("");
    } catch (error) {
      setBookingError(
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setSubmittingBooking(false);
    }
  }

  function navigate(tab) {
    setActiveTab(tab);
    closeServiceModal();
    setNotice("");
    setBookingError("");
  }

  if (providerCategory) {
    return (
      <ProviderListing
  service={providerCategory}
  customer={customer}
  onBack={() => setProviderCategory(null)}
  onBookProvider={handleBookProvider}
/>
    );
  }

  return (
    <div className="ee-dashboard">
      <header className="ee-header">
        <button
          className="ee-brand"
          onClick={() => navigate("Explore")}
        >
          <span className="ee-brand-mark">e.</span>
          <span>EventEase</span>
        </button>

        <nav className="ee-nav">
          <button
            className={activeTab === "Explore" ? "ee-nav-active" : ""}
            onClick={() => navigate("Explore")}
          >
            Explore
          </button>

          <button
            className={
              activeTab === "My Bookings" ? "ee-nav-active" : ""
            }
            onClick={() => navigate("My Bookings")}
          >
            My Bookings
            {bookings.length > 0 && (
              <span className="ee-count">{bookings.length}</span>
            )}
          </button>
        </nav>

        <div className="ee-user">
          <span className="ee-avatar">
            {(customer?.name || "C").charAt(0).toUpperCase()}
          </span>

          <div className="ee-user-copy">
            <strong>{customer?.name || "Customer"}</strong>
            <span>Customer account</span>
          </div>

          <button className="ee-logout" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="ee-main">
        {notice && (
          <div className="ee-notice" role="status">
            <span>✓</span>
            {notice}
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {activeTab === "Explore" && (
          <>
            <section className="ee-welcome">
              <div className="ee-welcome-copy">
                <span className="ee-eyebrow">
                  YOUR PERSONAL EVENT PLANNER
                </span>

                <h1>
                  Hello,{" "}
                  {customer?.name?.trim().split(/\s+/)[0] || "there"}!
                  <br />
                  <span>Let's make it special.</span>
                </h1>

                <p>
                  Find trusted professionals and bring your celebration
                  to life, one beautiful detail at a time.
                </p>

                <button
                  className="ee-primary"
                  onClick={() =>
                    document
                      .getElementById("ee-services")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Explore services <span>→</span>
                </button>
              </div>

              <div className="ee-welcome-image">
                <img
                  src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=85"
                  alt="Elegant celebration setup"
                />

                <div className="ee-image-note">
                  <span>✿</span>
                  <div>
                    <strong>Made for your moments</strong>
                    <small>
                      Every detail, thoughtfully planned.
                    </small>
                  </div>
                </div>
              </div>
            </section>

            <section className="ee-stats">
              <div>
                <span className="ee-stat-icon">♡</span>
                <div>
                  <strong>{services.length}</strong>
                  <span>Service listings</span>
                </div>
              </div>

              <div>
                <span className="ee-stat-icon">▤</span>
                <div>
                  <strong>{bookings.length}</strong>
                  <span>Your booking requests</span>
                </div>
              </div>

              <div>
                <span className="ee-stat-icon">✧</span>
                <div>
                  <strong>One place</strong>
                  <span>For your celebrations</span>
                </div>
              </div>
            </section>

            <section className="ee-service-section" id="ee-services">
              <div className="ee-section-heading">
                <div>
                  <span className="ee-eyebrow">
                    FIND YOUR PERFECT MATCH
                  </span>
                  <h2>Explore our services</h2>
                  <p>
                    Little details make the biggest memories.
                  </p>
                </div>
              </div>

              <div className="ee-search-row">
                <label className="ee-search">
                  <span>⌕</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search services or providers..."
                    aria-label="Search services"
                  />

                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      type="button"
                    >
                      ×
                    </button>
                  )}
                </label>
              </div>

              <div className="ee-categories">
                {categories.map((item) => (
                  <button
                    key={item}
                    className={
                      category === item ? "ee-category-active" : ""
                    }
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {servicesLoading && (
                <p role="status">Loading services...</p>
              )}

              {servicesError && (
                <div className="ee-empty" role="alert">
                  <h3>Unable to load services</h3>
                  <p>{servicesError}</p>
                  <button
                    className="ee-primary"
                    onClick={() => window.location.reload()}
                  >
                    Try again
                  </button>
                </div>
              )}

              {!servicesLoading && !servicesError && (
                <>
                  <div className="ee-service-grid">
                    {filteredServices.map((service) => (
                      <article
                        className="ee-service-card"
                        key={service.id}
                      >
                        <div className="ee-card-image">
                          <img
                            src={service.image}
                            alt={service.name}
                          />
                          <span className="ee-card-tag">
                            {service.category}
                          </span>
                        </div>

                        <div className="ee-card-content">
                          <h3>{service.name}</h3>
                          <p>{service.description}</p>

                          <div className="ee-card-bottom">
                            <div className="ee-price">
                              <small>Starting from</small>
                              <strong>
                                ₹{service.price.toLocaleString("en-IN")}
                              </strong>
                            </div>

                            <button onClick={() => openBooking(service)}>
                              Book now <span>→</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  {filteredServices.length === 0 && (
                    <div className="ee-empty">
                      <span>♡</span>
                      <h3>No services found</h3>
                      <p>
                        Try another search or choose a different category.
                      </p>

                      <button
                        className="ee-primary"
                        onClick={() => {
                          setSearch("");
                          setCategory("All");
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </>
              )}

              <p className="ee-coming-soon">
                More providers coming soon!
              </p>
            </section>
          </>
        )}

        {activeTab === "My Bookings" && (
          <section className="ee-bookings-page">
            <span className="ee-eyebrow">
              YOUR CELEBRATION, YOUR WAY
            </span>
            <h1>My bookings</h1>
            <p className="ee-bookings-intro">
              Keep track of the services you've requested.
            </p>

            {bookingsLoading && (
              <p role="status">Loading your bookings...</p>
            )}

            {bookingError && (
              <div className="ee-empty" role="alert">
                <p>{bookingError}</p>
                <button
                  className="ee-primary"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </div>
            )}

            {!bookingsLoading &&
              !bookingError &&
              (bookings.length === 0 ? (
                <div className="ee-empty">
                  <span>♡</span>
                  <h3>Your story starts here</h3>
                  <p>You haven't made any booking requests yet.</p>

                  <button
                    className="ee-primary"
                    onClick={() => navigate("Explore")}
                  >
                    Explore services →
                  </button>
                </div>
              ) : (
                <div className="ee-booking-list">
                  {bookings.map((booking) => (
                    <article
                      className="ee-booking-card"
                      key={booking.id}
                    >
                      <div className="ee-booking-symbol">✿</div>

                      <div className="ee-booking-info">
                        <h3>{booking.service}</h3>
                        <p>Provider: {booking.providerName}</p>
                        <p>
                          {booking.eventType} · {booking.eventDate}
                        </p>
                        <p>{booking.location}</p>
                        {booking.notes && <p>{booking.notes}</p>}
                      </div>

                      <div className="ee-booking-right">
                        <strong>
                          ₹{booking.price.toLocaleString("en-IN")}
                        </strong>
                        <span className="ee-status">
                          {booking.status}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ))}
          </section>
        )}
      </main>

      <footer className="ee-footer">
        <strong>
          EventEase <span>✿</span>
        </strong>
        <p>Making every celebration memorable.</p>
      </footer>

      {selectedService && (
        <div
          className="ee-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeServiceModal();
            }
          }}
        >
          <section
            className="ee-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ee-modal-title"
          >
            <button
              className="ee-modal-close"
              onClick={closeServiceModal}
              aria-label="Close"
              type="button"
            >
              ×
            </button>

            {!showBookingForm ? (
              <div className="ee-provider-profile">
                <span className="ee-eyebrow">MEET YOUR PROVIDER</span>

                <div className="ee-provider-image">
                  <img
                    src={selectedService.image}
                    alt={selectedService.providerName}
                  />
                </div>

                <h2 id="ee-modal-title">
                  {selectedService.providerName}
                </h2>

                <p className="ee-provider-category">
                  {selectedService.category} Services
                </p>

                <p>{selectedService.description}</p>

                <div className="ee-provider-price">
                  <small>Starting from</small>
                  <strong>
                    ₹{selectedService.price.toLocaleString("en-IN")}
                  </strong>
                </div>

                <p className="ee-coming-soon">
                  More providers coming soon!
                </p>

                <button
                  className="ee-primary ee-submit-booking"
                  onClick={() => setShowBookingForm(true)}
                  type="button"
                >
                  Book this provider →
                </button>
              </div>
            ) : (
              <>
                <span className="ee-eyebrow">
                  LET'S PLAN SOMETHING LOVELY
                </span>

                <h2 id="ee-modal-title">
                  Book {selectedService.name}
                </h2>

                <p className="ee-modal-description">
                  Provider:{" "}
                  <strong>{selectedService.providerName}</strong>
                  <br />
                  Starting from{" "}
                  <strong>
                    ₹{selectedService.price.toLocaleString("en-IN")}
                  </strong>
                  . Send us your event details.
                </p>

                <form
                  className="ee-booking-form"
                  onSubmit={submitBooking}
                >
                  <label>
                    Event type
                    <select
                      value={bookingForm.eventType}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          eventType: event.target.value,
                        })
                      }
                    >
                      <option>Birthday</option>
                      <option>Wedding</option>
                      <option>Engagement</option>
                      <option>Anniversary</option>
                      <option>Corporate event</option>
                      <option>Other</option>
                    </select>
                  </label>

                  <label>
                    Event date
                    <input
                      type="date"
                      min={today}
                      value={bookingForm.eventDate}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          eventDate: event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Event location
                    <input
                      value={bookingForm.location}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          location: event.target.value,
                        })
                      }
                      placeholder="Enter area or venue"
                      required
                    />
                  </label>

                  <label>
                    Contact number
                    <input
                      type="tel"
                      value={bookingForm.phone}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          phone: event.target.value,
                        })
                      }
                      placeholder="Enter phone number"
                      pattern="[0-9+\\-\s]{10,15}"
                      required
                    />
                  </label>

                  <label>
                    Additional details{" "}
                    <span className="ee-optional">(optional)</span>
                    <textarea
                      value={bookingForm.notes}
                      onChange={(event) =>
                        setBookingForm({
                          ...bookingForm,
                          notes: event.target.value,
                        })
                      }
                      placeholder="Tell us anything else we should know"
                      rows="3"
                    />
                  </label>

                  {bookingError && (
                    <p role="alert">{bookingError}</p>
                  )}

                  <button
                    className="ee-primary ee-submit-booking"
                    type="submit"
                    disabled={submittingBooking}
                  >
                    {submittingBooking
                      ? "Submitting..."
                      : "Submit booking request →"}
                  </button>

                  <p className="ee-form-note">
                    Your request will be saved and its status will appear
                    in My Bookings.
                  </p>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
