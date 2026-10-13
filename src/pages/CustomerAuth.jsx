
import { useState } from "react";
import "../App.css";
import { API_URL, apiFetch } from "../api";

export default function CustomerAuth({ onBack, onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("Customer");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  function changeMode(loginMode) {
    setIsLogin(loginMode);
    setForm({ name: "", email: "", password: "" });

    if (!loginMode && role === "Admin") {
      setRole("Customer");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      let endpoint;

      if (role === "Customer") {
        endpoint = `${API_URL}/customers/${isLogin ? "login" : "register"}`;
      } else if (role === "Service Provider") {
        endpoint = `${API_URL}/providers/${isLogin ? "login" : "register"}`;
      } else {
        endpoint = `${API_URL}/admin/login`;
      }

      const payload = isLogin
        ? { email: form.email, password: form.password }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
          };

      const response = await apiFetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof data === "string"
            ? data
            : data?.message ||
              (data?.status === "PENDING"
                ? "Your account is awaiting admin approval."
                : "Unable to complete your request. Please try again.");

        alert(message);
        return;
      }

      if (!isLogin) {
        alert(
          role === "Service Provider"
            ? "Registration successful! Your account is awaiting admin approval."
            : "Registration successful! You can now log in."
        );

        setForm({ name: "", email: "", password: "" });
        setIsLogin(true);
        return;
      }

      const normalizedRole =
        data?.role ||
        (role === "Service Provider"
          ? "SERVICE_PROVIDER"
          : role.toUpperCase());

      const account = {
        ...data,
        role: normalizedRole,
      };

      alert(`Welcome, ${data?.name || role}! Login successful.`);
      onLogin(account);
    } catch (error) {
      alert(error.message || "Cannot connect to the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <button className="auth-back" onClick={onBack} type="button">
        ← Back to Home
      </button>

      <div className="auth-card">
        <p className="auth-eyebrow">MAKE EVERY MOMENT SPECIAL</p>

        <h1>{isLogin ? "Welcome back." : "Join EventEase."}</h1>

        <p className="auth-subtitle">
          {isLogin
            ? "Sign in to continue to EventEase."
            : "Create an account and make every event memorable."}
        </p>

        <div className="auth-tabs">
          <button
            className={isLogin ? "active" : ""}
            onClick={() => changeMode(true)}
            type="button"
          >
            Login
          </button>

          <button
            className={!isLogin ? "active" : ""}
            onClick={() => changeMode(false)}
            type="button"
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            I am a
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setForm({ name: "", email: "", password: "" });
              }}
              required
            >
              <option value="Customer">Customer</option>
              <option value="Service Provider">Service Provider</option>
              {isLogin && <option value="Admin">Admin</option>}
            </select>
          </label>

          {!isLogin && (
            <label>
              Full name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </label>

          {role === "Admin" && (
            <p className="auth-subtitle">
              Admin registration is disabled. Use an authorized
              administrator account to log in.
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? "Login to your account →"
                : "Create account →"}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "New to EventEase?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => changeMode(!isLogin)}
          >
            {isLogin ? "Register here" : "Login here"}
          </button>
        </p>
      </div>
    </div>
  );
}
