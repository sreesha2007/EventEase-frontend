
import { useState, useEffect, useCallback } from "react";
import "./ProviderDashboard.css";
import { API_URL } from "../api";

const initialServiceForm = {
  category: "Photography",
  title: "",
  description: "",
  price: "",
  imageUrl: "",
};

export default function ProviderDashboard({ provider, onLogout }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [serviceForm, setServiceForm] = useState(initialServiceForm);
  const [savingService, setSavingService] = useState(false);

  const providerName = provider?.name || "Service Provider";
  const providerId = provider?.id;

  const menuItems = [
    "Overview",
    "My Profile",
    "My Services",
    "Add Service",
    "Booking Requests",
  ];

  const loadProviderData = useCallback(async () => {
    if (!providerId) {
      setError("Provider account ID is missing. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [servicesResponse, bookingsResponse] = await Promise.all([
        fetch(`${API_URL}/services/provider/${providerId}`),
        fetch(`${API_URL}/bookings/provider/${providerId}`),
      ]);

      if (!servicesResponse.ok) {
        const data = await servicesResponse.json().catch(() => ({}));
        throw new Error(data.message || "Unable to load your services.");
      }

      if (!bookingsResponse.ok) {
        throw new Error("Unable to load booking requests.");
      }

      const servicesData = await servicesResponse.json();
      const bookingsData = await bookingsResponse.json();

      const formattedServices = servicesData.map((service) => ({
        ...service,
        name: service.title || service.name || service.category || "Service",
        category: service.category || "Other",
        description: service.description || "",
        price: Number(service.price || 0),
        image: service.imageUrl || service.image || "",
      }));

      const formattedBookings = bookingsData.map((booking) => {
        const service = formattedServices.find(
          (item) => Number(item.id) === Number(booking.serviceId)
        );

        return {
          ...booking,
          serviceName: service?.name || "Event service",
          category: service?.category || "Other",
          price: Number(service?.price || 0),
          status: booking.status || "PENDING",
        };
      });

      setServices(formattedServices);
      setBookings(formattedBookings);
    } catch (err) {
      setError(err.message || "Unable to connect to the EventEase server.");
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadProviderData();
  }, [loadProviderData]);

  const pendingBookings = bookings.filter(
    (booking) => String(booking.status).toUpperCase() === "PENDING"
  );

  const confirmedBookings = bookings.filter(
    (booking) => String(booking.status).toUpperCase() === "CONFIRMED"
  );

  function formatDate(date) {
    if (!date) return "Not specified";

    const parsedDate = new Date(`${date}T00:00:00`);

    return Number.isNaN(parsedDate.getTime())
      ? date
      : parsedDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  }

  async function updateBookingStatus(bookingId, status) {
    if (updatingId !== null) return;

    let rejectionReason = "";

    if (status === "REJECTED") {
      rejectionReason = window.prompt(
        "Enter a reason for rejecting this booking:"
      );

      if (rejectionReason === null) return;

      if (!rejectionReason.trim()) {
        window.alert("Please enter a rejection reason.");
        return;
      }
    }

    setUpdatingId(bookingId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/bookings/${bookingId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            rejectionReason: rejectionReason.trim(),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to update booking status.");
      }

      setNotice(
        status === "CONFIRMED"
          ? "Booking confirmed successfully!"
          : "Booking rejected successfully."
      );

      await loadProviderData();
    } catch (err) {
      setError(err.message || "Unable to update the booking.");
    } finally {
      setUpdatingId(null);
    }
  }

  function updateForm(field, value) {
    setServiceForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function addService(event) {
    event.preventDefault();

    if (!providerId) {
      setError("Provider account ID is missing. Please log in again.");
      return;
    }

    if (!serviceForm.title.trim() || !serviceForm.category) {
      setError("Please enter a service name and category.");
      return;
    }

    if (
      serviceForm.price === "" ||
      !Number.isFinite(Number(serviceForm.price)) ||
      Number(serviceForm.price) < 0
    ) {
      setError("Please enter a valid, non-negative price.");
      return;
    }

    setSavingService(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/services/provider/${providerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: serviceForm.category,
            title: serviceForm.title.trim(),
            description: serviceForm.description.trim(),
            price: Number(serviceForm.price),
            imageUrl: serviceForm.imageUrl.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to add the service.");
      }

      setServiceForm(initialServiceForm);
      setNotice(data.message || "Service added successfully!");

      await loadProviderData();
      setActiveTab("My Services");
    } catch (err) {
      setError(err.message || "Unable to add the service.");
    } finally {
      setSavingService(false);
    }
  }

  function renderBooking(booking) {
    const status = String(booking.status).toUpperCase();

    return (
      <article className="pd-booking-item" key={booking.id}>
        <div className="pd-booking-symbol">✿</div>

        <div className="pd-booking-details">
          <h4>{booking.serviceName}</h4>
          <p>Category: {booking.category}</p>
          <p>Customer account ID: {booking.customerId}</p>
          <p>Event date: {formatDate(booking.eventDate)}</p>
          <p>Location: {booking.eventLocation || "Not specified"}</p>

          {booking.message && (
            <p className="pd-booking-message">{booking.message}</p>
          )}

          {booking.rejectionReason && (
            <p>Reason: {booking.rejectionReason}</p>
          )}
        </div>

        <div className="pd-booking-actions">
          <span className={`pd-status pd-status-${status.toLowerCase()}`}>
            {status}
          </span>

          {status === "PENDING" && (
            <div className="pd-action-buttons">
              <button
                type="button"
                className="pd-primary"
                disabled={updatingId !== null}
                onClick={() => updateBookingStatus(booking.id, "CONFIRMED")}
              >
                {updatingId === booking.id ? "Updating..." : "Accept"}
              </button>

              <button
                type="button"
                className="pd-reject-button"
                disabled={updatingId !== null}
                onClick={() => updateBookingStatus(booking.id, "REJECTED")}
              >
                Reject
              </button>
            </div>
          )}

          <strong>₹{booking.price.toLocaleString("en-IN")}</strong>
        </div>
      </article>
    );
  }

  const formStyle = {
    display: "grid",
    gap: "16px",
    maxWidth: "650px",
    marginTop: "24px",
  };

  const fieldStyle = {
    display: "grid",
    gap: "7px",
    color: "#514044",
    fontWeight: 600,
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #e8cfd3",
    borderRadius: "10px",
    background: "#fffdfc",
    color: "#35292d",
    font: "inherit",
  };

  return (
    <div className="pd-page">
      <aside className="pd-sidebar">
        <button
          className="pd-brand"
          onClick={() => setActiveTab("Overview")}
        >
          <span className="pd-brand-icon">e.</span>
          <span>EventEase</span>
        </button>

        <div className="pd-sidebar-label">WORKSPACE</div>

        <nav className="pd-nav">
          {menuItems.map((item) => (
            <button
              key={item}
              className={activeTab === item ? "pd-nav-active" : ""}
              onClick={() => {
                setError("");
                setNotice("");
                setActiveTab(item);
              }}
            >
              <span className="pd-nav-icon">
                {item === "Overview"
                  ? "⌂"
                  : item === "My Profile"
                    ? "♙"
                    : item === "My Services"
                      ? "▤"
                      : item === "Add Service"
                        ? "+"
                        : "▧"}
              </span>
              {item}
            </button>
          ))}
        </nav>

        <div className="pd-sidebar-bottom">
          <div className="pd-mini-profile">
            <span className="pd-avatar">
              {providerName.charAt(0).toUpperCase()}
            </span>
            <div>
              <strong>{providerName}</strong>
              <small>Service Provider</small>
            </div>
          </div>

          <button className="pd-logout" onClick={onLogout}>
            ↪ Log out
          </button>
        </div>
      </aside>

      <main className="pd-main">
        <header className="pd-topbar">
          <div>
            <span className="pd-breadcrumb">
              Workspace / {activeTab}
            </span>
            <h2>{activeTab}</h2>
          </div>

          <div className="pd-top-user">
            <span className="pd-avatar">
              {providerName.charAt(0).toUpperCase()}
            </span>
            <div>
              <strong>{providerName}</strong>
              <small>Service Provider</small>
            </div>
          </div>
        </header>

        {notice && (
          <div className="pd-notice" role="status">
            {notice}
            <button onClick={() => setNotice("")}>×</button>
          </div>
        )}

        {error && (
          <div className="pd-error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="pd-primary"
              onClick={() => {
                setError("");
                loadProviderData();
              }}
            >
              Retry
            </button>
          </div>
        )}

        {activeTab === "Overview" && (
          <>
            <section className="pd-welcome">
              <div>
                <span className="pd-eyebrow">
                  YOUR EVENTEASE WORKSPACE
                </span>
                <h1>Welcome, {providerName.split(/\s+/)[0]}!</h1>
                <p>
                  Manage your services and keep track of customer booking
                  requests from one place.
                </p>
                <button
                  className="pd-primary"
                  onClick={() => setActiveTab("Add Service")}
                >
                  + Add a service
                </button>
              </div>
              <div className="pd-welcome-art">✿</div>
            </section>

            {loading ? (
              <p>Loading your dashboard...</p>
            ) : (
              <>
                <section className="pd-stats">
                  <article className="pd-stat-card">
                    <span className="pd-stat-icon">▤</span>
                    <p>My services</p>
                    <strong>{services.length}</strong>
                    <small>Services listed by you</small>
                  </article>

                  <article className="pd-stat-card">
                    <span className="pd-stat-icon">◷</span>
                    <p>Pending requests</p>
                    <strong>{pendingBookings.length}</strong>
                    <small>Waiting for your response</small>
                  </article>

                  <article className="pd-stat-card">
                    <span className="pd-stat-icon">✓</span>
                    <p>Confirmed bookings</p>
                    <strong>{confirmedBookings.length}</strong>
                    <small>Bookings accepted by you</small>
                  </article>
                </section>

                <section className="pd-panel">
                  <div className="pd-panel-heading">
                    <div>
                      <h3>Recent booking requests</h3>
                      <p>Customer requests for your services.</p>
                    </div>
                    <button
                      className="pd-text-button"
                      onClick={() => setActiveTab("Booking Requests")}
                    >
                      View all →
                    </button>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="pd-empty">
                      <span className="pd-empty-icon">♡</span>
                      <h3>No booking requests yet</h3>
                      <p>
                        Requests will appear here when customers book your
                        services.
                      </p>
                    </div>
                  ) : (
                    <div className="pd-booking-list">
                      {bookings.slice(0, 3).map(renderBooking)}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}

        {activeTab === "My Profile" && (
          <section className="pd-panel pd-profile-panel">
            <span className="pd-eyebrow">YOUR ACCOUNT</span>
            <h3>My Provider Profile</h3>
            <p className="pd-panel-description">
              Your account information and listed services.
            </p>

            <div className="pd-profile-avatar">
              {providerName.charAt(0).toUpperCase()}
            </div>

            <div className="pd-profile-details">
              <div>
                <span>Provider name</span>
                <strong>{providerName}</strong>
              </div>
              <div>
                <span>Email address</span>
                <strong>{provider?.email || "Not available"}</strong>
              </div>
              <div>
                <span>Account role</span>
                <strong>Service Provider</strong>
              </div>
              <div>
                <span>Account ID</span>
                <strong>{providerId || "Not available"}</strong>
              </div>
            </div>
          </section>
        )}

        {activeTab === "My Services" && (
          <section className="pd-panel">
            <div className="pd-panel-heading">
              <div>
                <span className="pd-eyebrow">YOUR LISTINGS</span>
                <h3>My Services</h3>
                <p>Manage the services customers can discover.</p>
              </div>
              <button
                type="button"
                className="pd-primary"
                onClick={() => setActiveTab("Add Service")}
              >
                + Add Service
              </button>
            </div>

            {loading ? (
              <p>Loading your services...</p>
            ) : services.length === 0 ? (
              <div className="pd-empty">
                <span className="pd-empty-icon">✿</span>
                <h3>No services added yet</h3>
                <p>Add your first service to get started.</p>
                <button
                  className="pd-primary"
                  onClick={() => setActiveTab("Add Service")}
                >
                  Add your first service
                </button>
              </div>
            ) : (
              <div className="pd-service-list">
                {services.map((service) => (
                  <article className="pd-service-item" key={service.id}>
                    {service.image && (
                      <img
                        src={service.image}
                        alt={service.name}
                        style={{
                          width: "90px",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "10px",
                        }}
                      />
                    )}

                    <div>
                      <h4>{service.name}</h4>
                      <p>{service.category}</p>
                      <p>{service.description}</p>
                    </div>

                    <strong>
                      ₹{service.price.toLocaleString("en-IN")}
                    </strong>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "Add Service" && (
          <section className="pd-panel">
            <span className="pd-eyebrow">GROW YOUR BUSINESS</span>
            <h3>Add a New Service</h3>
            <p className="pd-panel-description">
              Share your service details so customers can discover what you
              offer.
            </p>

            <form style={formStyle} onSubmit={addService}>
              <label style={fieldStyle}>
                Service category *
                
<select
  required
  value={serviceForm.category}
  onChange={(e) => updateForm("category", e.target.value)}
  style={inputStyle}
>
  <option value="Venue Booking">Venue Booking</option>
  <option value="DJ and Music">DJ and Music</option>
  <option value="Wedding Planning">Wedding Planning</option>
  <option value="Mehendi Artists">Mehendi Artists</option>
  <option value="Transportation">Transportation</option>
  <option value="Invitation Design">Invitation Design</option>
  <option value="Cake and Desserts">Cake and Desserts</option>
  <option value="Live Entertainment">Live Entertainment</option>
  <option value="Florists">Florists</option>
  <option value="Rental Services">Rental Services</option>
  <option value="Other">Other</option>
</select>

              </label>

              <label style={fieldStyle}>
                Service name *
                <input
                  required
                  maxLength={150}
                  value={serviceForm.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="e.g. Lens & Light Studio"
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                Description
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={serviceForm.description}
                  onChange={(e) =>
                    updateForm("description", e.target.value)
                  }
                  placeholder="Describe your service and what you offer..."
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                Price (₹) *
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={serviceForm.price}
                  onChange={(e) => updateForm("price", e.target.value)}
                  placeholder="e.g. 8000"
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                Image URL (optional)
                <input
                  type="url"
                  maxLength={1000}
                  value={serviceForm.imageUrl}
                  onChange={(e) => updateForm("imageUrl", e.target.value)}
                  placeholder="https://example.com/your-service-image.jpg"
                  style={inputStyle}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "8px",
                }}
              >
                <button
                  type="submit"
                  className="pd-primary"
                  disabled={savingService}
                >
                  {savingService ? "Saving service..." : "Save Service"}
                </button>

                <button
                  type="button"
                  className="pd-text-button"
                  disabled={savingService}
                  onClick={() => {
                    setServiceForm(initialServiceForm);
                    setError("");
                  }}
                >
                  Clear form
                </button>
              </div>
            </form>
          </section>
        )}

        {activeTab === "Booking Requests" && (
          <section className="pd-panel">
            <span className="pd-eyebrow">CUSTOMER BOOKINGS</span>
            <h3>Booking Requests</h3>
            <p className="pd-panel-description">
              Review customer requests, then accept or reject them.
            </p>

            <button
              type="button"
              className="pd-text-button"
              onClick={loadProviderData}
              disabled={loading}
            >
              ↻ Refresh requests
            </button>

            {loading ? (
              <p>Loading booking requests...</p>
            ) : bookings.length === 0 ? (
              <div className="pd-empty">
                <span className="pd-empty-icon">▤</span>
                <h3>No requests to display</h3>
                <p>
                  Booking requests for your services will appear here.
                </p>
              </div>
            ) : (
              <div className="pd-booking-list">
                {bookings.map(renderBooking)}
              </div>
            )}
          </section>
        )}

        <footer className="pd-footer">
          <strong>
            EventEase <span>✿</span>
          </strong>
          <p>Helping you make every celebration memorable.</p>
        </footer>
      </main>
    </div>
  );
}
