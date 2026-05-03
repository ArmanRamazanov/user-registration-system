import "../css/verificationForm.css";
import "../css/verificationResultForm.css";

import { useLocation, Navigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function EmailVerification() {
  const state = useLocation().state;
  const email = state?.email;

  const [message, setMessage] = useState("");

  const token = new URLSearchParams(window.location.search).get("token");
  const [status, setStatus] = useState<
    "loading" | "pending" | "success" | "error"
  >(token ? "loading" : "pending");

  useEffect(() => {
    if (!token) return;

    async function verify() {
      const response = await fetch(`api/auth/email-verify?token=${token}`);

      if (response.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    }

    verify();
  }, [token]);

  async function onClick(e: any) {
    e.preventDefault();

    const response = await fetch("http://localhost:4000/api/auth/resend", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const { success } = await response.json();

    if (success) {
      setMessage("Email was sent again");
      setTimeout(() => {
        setMessage("");
      }, 1000);
    }
  }

  if (status === "pending") {
    if (!email) return <Navigate to="/signup" />;
    return (
      <div className="verificationForm">
        {message && <div className="resend-success">{message}</div>}
        <h2>Verify your email address</h2>
        <div className="content">
          <p>
            We have sent a verification link to <span>{email}</span>.
          </p>
          <p>Click on the link to complete the verification process</p>
          <p>You might need to check your spam folder</p>
        </div>
        <button onClick={onClick}>Resend email</button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="loading">
        <h2>...Verifying</h2>
      </div>
    );
  }
  if (status === "success") {
    return (
      <div className="verificationResultForm">
        <h2>Success</h2>
        <p>You have successfully verified your account</p>
        <Link to="/login">Go to Login</Link>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="verificationResultForm">
        <h2>Error</h2>
        <p>There was an error</p>
        <Link to="/login">Go to Login</Link>
        <button onClick={onClick}>Verify again</button>
      </div>
    );
  }
  return <Navigate to="/signup" />;
}
