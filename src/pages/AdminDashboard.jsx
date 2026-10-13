
import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import { API_URL, apiFetch } from "../api";

const API = `${API_URL}/admin`;

export default function AdminDashboard({ admin, onLogout }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [providers, setProviders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  async function fetchList(url, errorMessage) {
    const response = await apiFetch(url);

    if (!response.ok) {
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [providerData, customerData, serviceData] =
        await Promise.all([
          fetchList(`${API}/providers`, "Could not load providers."),
          fetchList(`${API}/customers`, "Could not load customers."),
          fetchList(`${API}/services`, "Could not load services."),
        ]);

      setProviders(providerData);
      setCustomers(customerData);
      setServices(serviceData);
    } catch (err) {
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function approveProvider(provider) {
    try {
      const response = await apiFetch(
        `${API}/providers/${provider.customerId}/approve`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Approval failed.");
      }

      setActionMessage(
        `${provider.name || provider.email} approved successfully.`
      );

      await loadData();
    } catch (err) {
      setActionMessage(err.message);
    }
  }

  async function rejectProvider(provider) {
    const reason = window.prompt(
      "Enter the reason for rejecting this provider:"
    );

    if (!reason || !reason.trim()) return;

    try {
      const response = await apiFetch(
        `${API}/providers/${provider.customerId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Rejection failed.");
      }

      setActionMessage(
        `${provider.name || provider.email} rejected successfully.`
      );

      await loadData();
    } catch (err) {
      setActionMessage(err.message);
    }
  }

  const pending = providers.filter(
    (p) => p.approvalStatus?.toUpperCase() === "PENDING"
  );

  const approved = providers.filter(
    (p) => p.approvalStatus?.toUpperCase() === "APPROVED"
  );

  const rejected = providers.filter(
    (p) => p.approvalStatus?.toUpperCase() === "REJECTED"
  );

  function statusClass(status) {
    return (status || "PENDING").toLowerCase();
  }

  function providerTable(items, showActions = false) {
    if (!items.length) {
      return (
        <div className="ad-empty">
          No providers found in this section.
        </div>
      );
    }

    return (
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Email</th>
              <th>Business</th>
              <th>Status</th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {items.map((provider) => (
              <tr key={provider.customerId}>
                <td>{provider.name || "Unnamed provider"}</td>
                <td>{provider.email || "—"}</td>
                <td>{provider.businessName || "Not added yet"}</td>

                <td>
                  <span
                    className={`ad-status ${statusClass(
                      provider.approvalStatus
                    )}`}
                  >
                    {provider.approvalStatus || "PENDING"}
                  </span>

                  {provider.rejectionReason && (
                    <p className="ad-reason">
                      Reason: {provider.rejectionReason}
                    </p>
                  )}
                </td>

                {showActions && (
                  <td>
                    <div className="ad-actions">
                      <button
                        className="ad-approve"
                        onClick={() => approveProvider(provider)}
                      >
                        Approve
                      </button>

                      <button
                        className="ad-reject"
                        onClick={() => rejectProvider(provider)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function serviceTable() {
    if (!services.length) {
      return (
        <div className="ad-empty">
          No services have been added yet.
        </div>
      );
    }

    return (
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Category</th>
              <th>Price</th>
              <th>Business / Provider</th>
              <th>Provider Email</th>
              <th>Provider Status</th>
            </tr>
          </thead>

          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td>
                  <strong>{service.title || "Untitled service"}</strong>
                  {service.description && (
                    <p className="ad-reason">{service.description}</p>
                  )}
                </td>

                <td>{service.category || "—"}</td>

                <td>
                  ₹
                  {Number(service.price || 0).toLocaleString("en-IN")}
                </td>

                <td>
                  <strong>
                    {service.businessName || "Unknown provider"}
                  </strong>
                  <p className="ad-reason">
                    {service.providerName || "—"}
                  </p>
                </td>

                <td>{service.providerEmail || "—"}</td>

                <td>
                  <span
                    className={`ad-status ${statusClass(
                      service.approvalStatus
                    )}`}
                  >
                    {service.approvalStatus || "UNKNOWN"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const menuItems = [
    "Overview",
    "Provider Approvals",
    "All Providers",
    "All Services",
    "Customers",
  ];

  return (
    <div className="ad-layout">
      <aside className="ad-sidebar">
        <button
          className="ad-brand"
          onClick={() => setActiveTab("Overview")}
        >
          <span className="ad-brand-mark">e.</span>
          <span>EventEase</span>
        </button>

        <p className="ad-menu-label">ADMIN WORKSPACE</p>

        <nav className="ad-nav">
          {menuItems.map((item) => (
            <button
              key={item}
              className={activeTab === item ? "ad-nav-active" : ""}
              onClick={() => {
                setActiveTab(item);
                setActionMessage("");
              }}
            >
              <span>
                {item === "Overview"
                  ? "⌂"
                  : item === "Provider Approvals"
                  ? "✓"
                  : item === "All Providers"
                  ? "▤"
                  : item === "All Services"
                  ? "◇"
                  : "♙"}
              </span>

              <span>{item}</span>

              {item === "Provider Approvals" && pending.length > 0 && (
                <b>{pending.length}</b>
              )}
            </button>
          ))}
        </nav>

        <div className="ad-sidebar-bottom">
          <div className="ad-admin-user">
            <span className="ad-avatar">
              {(admin?.name || "A").charAt(0).toUpperCase()}
            </span>

            <div>
              <strong>{admin?.name || "Administrator"}</strong>
              <small>Administrator</small>
            </div>
          </div>

          <button className="ad-logout" onClick={onLogout}>
            ↪ Log out
          </button>
        </div>
      </aside>

      <main className="ad-main">
        <header className="ad-topbar">
          <div>
            <span className="ad-breadcrumb">
              Workspace / {activeTab}
            </span>
            <h1>{activeTab}</h1>
          </div>

          <button className="ad-refresh" onClick={loadData}>
            ↻ Refresh
          </button>
        </header>

        {error && <div className="ad-alert">{error}</div>}

        {actionMessage && (
          <div className="ad-success">{actionMessage}</div>
        )}

        {loading ? (
          <div className="ad-panel">Loading dashboard...</div>
        ) : (
          <>
            {activeTab === "Overview" && (
              <>
                <section className="ad-welcome">
                  <span className="ad-eyebrow">
                    EVENTEASE MANAGEMENT
                  </span>

                  <h2>Welcome, {admin?.name || "Admin"}!</h2>

                  <p>
                    Manage provider registrations and monitor services
                    available on EventEase.
                  </p>
                </section>

                <section className="ad-stats">
                  <article>
                    <span>▤</span>
                    <p>Total providers</p>
                    <strong>{providers.length}</strong>
                  </article>

                  <article>
                    <span>◷</span>
                    <p>Pending approvals</p>
                    <strong>{pending.length}</strong>
                  </article>

                  <article>
                    <span>◇</span>
                    <p>Total services</p>
                    <strong>{services.length}</strong>
                  </article>

                  <article>
                    <span>♙</span>
                    <p>Total customers</p>
                    <strong>{customers.length}</strong>
                  </article>
                </section>

                <section className="ad-panel">
                  <div className="ad-panel-heading">
                    <div>
                      <h2>Pending provider approvals</h2>
                      <p>
                        Review registrations before providers manage
                        their services.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setActiveTab("Provider Approvals")
                      }
                    >
                      View all →
                    </button>
                  </div>

                  {providerTable(pending, true)}
                </section>

                <section className="ad-panel">
                  <div className="ad-panel-heading">
                    <div>
                      <h2>Recently available services</h2>
                      <p>
                        View the services and providers in your
                        marketplace.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab("All Services")}
                    >
                      View all →
                    </button>
                  </div>

                  {serviceTable()}
                </section>
              </>
            )}

            {activeTab === "Provider Approvals" && (
              <section className="ad-panel">
                <h2>Pending Provider Approvals</h2>

                <p className="ad-description">
                  Approve providers or reject them with a reason.
                </p>

                {providerTable(pending, true)}
              </section>
            )}

            {activeTab === "All Providers" && (
              <>
                <section className="ad-panel">
                  <h2>Approved Providers</h2>
                  {providerTable(approved)}
                </section>

                <section className="ad-panel">
                  <h2>Pending Providers</h2>
                  {providerTable(pending, true)}
                </section>

                <section className="ad-panel">
                  <h2>Rejected Providers</h2>
                  {providerTable(rejected)}
                </section>
              </>
            )}

            {activeTab === "All Services" && (
              <section className="ad-panel">
                <h2>All Services</h2>

                <p className="ad-description">
                  Every service listing with its business name,
                  provider details, price, and approval status.
                </p>

                {serviceTable()}
              </section>
            )}

            {activeTab === "Customers" && (
              <section className="ad-panel">
                <h2>Registered Customers</h2>

                <p className="ad-description">
                  Customer accounts registered in EventEase.
                </p>

                {customers.length === 0 ? (
                  <div className="ad-empty">
                    No customers found.
                  </div>
                ) : (
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                        </tr>
                      </thead>

                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer.id}>
                            <td>{customer.name}</td>
                            <td>{customer.email}</td>
                            <td>{customer.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        <footer className="ad-footer">
          EventEase <span>✿</span> · Administration
        </footer>
      </main>
    </div>
  );
}
