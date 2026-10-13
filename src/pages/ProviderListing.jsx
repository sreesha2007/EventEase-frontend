
import { useState, useEffect } from "react";
import "./ProviderListing.css";
import { API_URL, apiFetch } from "../api";

export default function ProviderListing({
  service,
  customer,
  onBack,
  onBookProvider,
}) {
  const [bookedDates, setBookedDates] = useState([]);
  const [previousBooking, setPreviousBooking] = useState(null);
  const [loadingDates, setLoadingDates] = useState(true);
  const [datesError, setDatesError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBookingInformation() {
      setLoadingDates(true);
      setDatesError("");
      setPreviousBooking(null);
      setBookedDates([]);

      try {
        const datesPromise = apiFetch(
          `${API_URL}/bookings/service/${service.id}/booked-dates`
        );

        const customerBookingsPromise = customer?.id
          ? apiFetch(`${API_URL}/bookings/customer/${customer.id}`)
          : Promise.resolve(null);

        const [datesResponse, customerResponse] = await Promise.all([
          datesPromise,
          customerBookingsPromise,
        ]);

        if (!datesResponse.ok) {
          throw new Error("Unable to load confirmed booking dates.");
        }

        if (customerResponse && !customerResponse.ok) {
          throw new Error("Unable to load your booking history.");
        }

        const dates = await datesResponse.json();

        const customerBookings = customerResponse
          ? await customerResponse.json()
          : [];

        if (cancelled) return;

        setBookedDates(Array.isArray(dates) ? dates : []);

        // Find this customer's existing request for this service,
        // regardless of its event date or status.
        const existingBooking = customerBookings.find(
          (booking) =>
            Number(booking.serviceId) === Number(service.id)
        );

        setPreviousBooking(existingBooking || null);
      } catch (error) {
        if (!cancelled) {
          setDatesError(
            error.message || "Unable to load booking information."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingDates(false);
        }
      }
    }

    if (service?.id) {
      loadBookingInformation();
    } else {
      setLoadingDates(false);
      setDatesError("Service ID is unavailable.");
    }

    return () => {
      cancelled = true;
    };
  }, [service?.id, customer?.id]);

  function formatDate(date) {
    if (!date) return "Not specified";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const bookingStatus = String(
    previousBooking?.status || ""
  ).toUpperCase();

  function getBookingMessage() {
    if (bookingStatus === "CONFIRMED") {
      return "Your booking is confirmed. You cannot submit another request for this service.";
    }

    if (bookingStatus === "REJECTED") {
      return "Your previous request was rejected. You cannot submit another request for this service.";
    }

    return "Your booking request has been sent. Please wait for the provider's response.";
  }

  return (
    <div className="provider-page">
      <header className="provider-header">
        <button className="provider-brand" onClick={onBack}>
          <span className="provider-brand-mark">e.</span>
          EventEase
        </button>

        <button className="provider-back-button" onClick={onBack}>
          ← Back to dashboard
        </button>
      </header>

      <main className="provider-main">
        <div className="provider-heading">
          <span className="provider-eyebrow">
            YOUR PERFECT EVENT PARTNER
          </span>

          <h1>{service.category} Providers</h1>

          <p>
            Discover the right professional to make your special
            occasion memorable.
          </p>
        </div>

        <article className="provider-card">
          <div className="provider-cover">
            <img
              src={service.image}
              alt={service.providerName}
            />

            <span className="provider-category-tag">
              {service.category}
            </span>
          </div>

          <div className="provider-details">
            <span className="provider-available">
              <span className="provider-dot" />
              Featured provider
            </span>

            <h2>{service.providerName}</h2>

            <p className="provider-specialty">
              Professional {service.category.toLowerCase()} services
            </p>

            <p className="provider-description">
              {service.description}
            </p>

            <div className="provider-price">
              <span>Starting from</span>

              <strong>
                ₹{Number(service.price || 0).toLocaleString("en-IN")}
              </strong>
            </div>

            {loadingDates ? (
              <p>Checking your booking history...</p>
            ) : datesError ? (
              <p className="provider-dates-error">
                {datesError}
              </p>
            ) : previousBooking ? (
              <div
                className="provider-existing-booking"
                role="status"
              >
                <strong>
                  You've already requested this service!
                </strong>

                <p>{getBookingMessage()}</p>

                <div className="provider-existing-status">
                  Status: <span>{bookingStatus}</span>
                </div>

                <p>
                  Event date: {formatDate(previousBooking.eventDate)}
                </p>

                {bookingStatus === "REJECTED" &&
                  previousBooking.rejectionReason && (
                    <p>
                      Rejection reason:{" "}
                      {previousBooking.rejectionReason}
                    </p>
                  )}
              </div>
            ) : (
              <button
                className="provider-book-button"
                onClick={() => onBookProvider(service)}
              >
                Book This Provider <span>→</span>
              </button>
            )}

            <section className="provider-booked-dates">
              <h3>Previously Booked Dates</h3>

              <p>
                Dates when this service has already been confirmed
                for other customers.
              </p>

              {loadingDates ? (
                <p>Loading booked dates...</p>
              ) : datesError ? (
                <p className="provider-dates-error">
                  Booked dates could not be loaded.
                </p>
              ) : bookedDates.length === 0 ? (
                <p className="provider-no-bookings">
                  No confirmed bookings yet.
                </p>
              ) : (
                <ul>
                  {bookedDates.map((date) => (
                    <li key={date}>
                      <span>{formatDate(date)}</span>
                      <span className="provider-booked-badge">
                        Booked
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </article>

        <div className="provider-coming-soon">
          <span className="provider-coming-icon">✿</span>

          <div>
            <h3>More providers coming soon!</h3>
            <p>
              We're working on bringing more professionals to
              EventEase. Stay tuned for more choices.
            </p>
          </div>
        </div>
      </main>

      <footer className="provider-footer">
        <strong>
          EventEase <span>✿</span>
        </strong>

        <p>Making every celebration memorable.</p>
      </footer>
    </div>
  );
}
