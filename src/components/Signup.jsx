import axios from "axios";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const Signup = () => {

  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState("personal");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const navigate = useNavigate();

  const submithandler = async (data) => {
    setLoading(true);

    try {

      const payload = {
        email: data.email,
        password: data.password,
        role: accountType,
      };

      if (accountType === "business") {
        payload.businessName = data.businessName
        payload.businessCountry = data.businessCountry
      } else {
        payload.firstName = data.firstName
        payload.lastName = data.lastName
      }

      const res = await axios.post("/user/register", payload);

      if (res.status === 201) {
        toast.success("Registration Successful");
        navigate("/login")

        if (res.data?.data?.firstName) {
          localStorage.setItem("firstName", res.data.data.firstName);
        }
      }

    } catch (err) {
      toast.error(err.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false)
      reset()
    }
  }

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleSubmit(submithandler)}>

        <h2 style={styles.heading}>Create an account</h2>

        {/* Toggle Buttons */}
        <div style={styles.toggleContainer}>
          <button
            type="button"
            onClick={() => setAccountType("personal")}
            style={
              accountType === "personal"
                ? styles.activeToggle
                : styles.toggleButton
            }
          >
            Personal
          </button>

          <button
            type="button"
            onClick={() => setAccountType("business")}
            style={
              accountType === "business"
                ? styles.activeToggle
                : styles.toggleButton
            }
          >
            Business
          </button>
        </div>

        {/* PERSONAL ACCOUNT */}
        {accountType === "personal" && (
          <>
            <div>
              <input
                type="text"
                placeholder="First Name"
                style={styles.input}
                {...register("firstName", { required: "First name required" })}
              />
              <p style={styles.error}>{errors.firstName?.message}</p>
            </div>

            <div>
              <input
                type="text"
                placeholder="Last Name"
                style={styles.input}
                {...register("lastName", { required: "Last name required" })}
              />
              <p style={styles.error}>{errors.lastName?.message}</p>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <input
                type="email"
                placeholder="Email"
                style={styles.input}
                {...register("email", { required: "Email required" })}
              />
              <p style={styles.error}>{errors.email?.message}</p>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <input
                type="password"
                placeholder="Password"
                style={styles.input}
                {...register("password", { required: "Password required" })}
              />
              <p style={styles.error}>{errors.password?.message}</p>
            </div>
          </>
        )}

        {/* BUSINESS ACCOUNT */}
        {accountType === "business" && (
          <>
            <div style={{ gridColumn: "1 / -1" }}>
            <input
              type="text"
              placeholder="Business Name"
              style={styles.input}
              {...register("businessName", {
                required: "Business name required",
              })}
            />
            <p style={styles.error}>{errors.businessName?.message}</p>
          </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <input
                type="email"
                placeholder="Email"
                style={styles.input}
                {...register("email", { required: "Email required" })}
              />
              <p style={styles.error}>{errors.email?.message}</p>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <input
                type="password"
                placeholder="Password"
                style={styles.input}
                {...register("password", { required: "Password required" })}
              />
              <p style={styles.error}>{errors.password?.message}</p>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <select
                style={styles.input}
                {...register("businessCountry", {
                  required: "Please select your business country",
                })}
              >
                <option value="" disabled hidden>
                  Where is your business registered?
                </option>

                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Japan">Japan</option>
                <option value="China">China</option>
                <option value="Brazil">Brazil</option>
                <option value="South Africa">South Africa</option>

              </select>

              <p style={styles.error}>{errors.businessCountry?.message}</p>
            </div>
          </>
        )}

        {/* SUBMIT BUTTON */}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        {/* Divider */}

        <div style={styles.divider}>
          <div style={styles.line}></div>
          <span style={styles.dividerText}>or continue with</span>
          <div style={styles.line}></div>
        </div>

        {/* Social Login */}

        <div style={styles.socialContainer}>

          <button type="button" style={styles.socialButton}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/300/300221.png"
              alt="google"
              style={styles.icon}
            />
            Google
          </button>

          <button type="button" style={styles.socialButton}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/0/747.png"
              alt="apple"
              style={styles.icon}
            />
            Apple
          </button>

          <button type="button" style={styles.socialButton}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/124/124010.png"
              alt="facebook"
              style={styles.icon}
            />
            Facebook
          </button>

        </div>

      </form>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },

  form: {
    backgroundColor: "white",
    padding: "48px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "520px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    boxShadow:
      "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.05)",
  },

  heading: {
    gridColumn: "1 / -1",
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "700",
    color: "#1E293B",
  },

  toggleContainer: {
    gridColumn: "1 / -1",
    display: "flex",
    backgroundColor: "#F1F5F9",
    border: "2px solid #08090948",
    borderRadius: "30px",
    padding: "4px",
  },

  toggleButton: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "transparent",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748B",
  },

  activeToggle: {
    flex: 1,
    padding: "10px",
    border: "none",
    backgroundColor: "#1E293B",
    color: "white",
    borderRadius: "40px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },

  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #130c0c69",
    fontSize: "15px",
  },

  button: {
    gridColumn: "1 / -1",
    marginTop: "12px",
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#4F46E5",
    color: "white",
    fontSize: "15px",
    fontWeight: "600",
  },

  divider: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    margin: "20px 0",
  },

  line: { flex: 1, height: "1px", backgroundColor: "#E2E8F0" },

  dividerText: {
    margin: "0 12px",
    fontSize: "12px",
    color: "#94A3B8",
    fontWeight: "500",
  },

  socialContainer: {
    gridColumn: "1 / -1",
    display: "flex",
    gap: "12px",
  },

  socialButton: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px",
    borderRadius: "30px",
    border: "1px solid #000000",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },

  icon: { width: "18px", height: "18px" },

  error: {
    color: "#EF4444",
    fontSize: "11px",
    marginTop: "4px",
    fontWeight: "500",
  },
};