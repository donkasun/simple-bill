import React, { useEffect } from "react";
import { useAuth } from "@auth/useAuth";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const { signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        overflow: "hidden",
        padding: "1rem",
        backgroundColor: "#f5f5f5",
        color: "#333",
      }}
    >
      <div style={{ width: "100%", maxWidth: 384 }}>
        <div
          style={{
            background: "#fff",
            padding: "2.5rem",
            borderRadius: "12px",
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            {/* Circular light blue background with white document icon */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "#e3f2fd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <svg
                style={{
                  width: "32px",
                  height: "32px",
                  color: "#1976d2",
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></path>
              </svg>
            </div>
            <h1
              style={{
                fontSize: "2rem",
                lineHeight: "2.25rem",
                fontWeight: 700,
                color: "#333",
                margin: "0 0 0.5rem 0",
              }}
            >
              SimpleBill
            </h1>
            <p
              style={{
                margin: "0",
                fontSize: "1rem",
                color: "#666",
                lineHeight: "1.5",
              }}
            >
              Sign in to manage your invoices and quotations.
            </p>
          </div>

          {/* Black Google sign-in button */}
          <button
            onClick={signInWithGoogle}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              padding: "0.875rem 1rem",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "1rem",
              backgroundColor: "#000",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#333";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#000";
            }}
          >
            <svg
              style={{ width: "20px", height: "20px" }}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "0.875rem",
            color: "#666",
            lineHeight: "1.4",
          }}
        >
          By signing in, you agree to our{" "}
          <a
            style={{
              fontWeight: 500,
              color: "#1976d2",
              textDecoration: "none",
            }}
            href="/terms"
          >
            Terms of Service
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default Login;
