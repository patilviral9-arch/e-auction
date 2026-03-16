import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext"; // ← one level up, not two

export const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const navigate = useNavigate();
  const { login } = useAuth(); // ← updates navbar instantly, no refresh needed

  const validationschema = {
    email: {
      required: "Email is required *",
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Enter valid email address *",
      },
    },
    password: {
      required: "Password is required *",
      minLength: {
        value: 6,
        message: "Minimum 6 characters required *",
      },
    },
  };

  const submitHandler = async (data) => {
    try {
      const res = await axios.post("/user/login", data);
      console.log("Login Response:", res.data);

      if (res.status === 200) {
        const userData = res.data.data;
        const role     = userData?.role?.toLowerCase();
        const userName = userData?.firstName || userData?.businessName || "User";

        // Write to localStorage (same as before)
        localStorage.setItem("userName", userName);
        localStorage.setItem("role",     userData.role);

        // ✅ Updates AuthContext state → navbar re-renders instantly, no refresh needed
        login({ role: userData.role, userName });

        toast.success("Login Success");

        if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login Failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h2 style={styles.heading}>Sign In</h2>
        <form onSubmit={handleSubmit(submitHandler)} style={styles.formStack}>
          <div style={styles.inputGroup}>
            <input type="email" placeholder="Email" style={styles.input} {...register("email", validationschema.email)} />
            {errors.email && <p style={styles.error}>{errors.email.message}</p>}
          </div>
          <div style={styles.inputGroup}>
            <input type="password" placeholder="Password" style={styles.input} {...register("password", validationschema.password)} />
            {errors.password && <p style={styles.error}>{errors.password.message}</p>}
          </div>
          <button type="submit" style={styles.button}>Login</button>
          <div style={styles.socialContainer}>
            <button type="button" style={styles.socialButton}>
              <img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" alt="google" style={styles.icon} />
              Google
            </button>
            <button type="button" style={styles.socialButton}>
              <img src="https://cdn-icons-png.flaticon.com/512/0/747.png" alt="apple" style={styles.icon} />
              Apple
            </button>
            <button type="button" style={styles.socialButton}>
              <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="facebook" style={styles.icon} />
              Facebook
            </button>
          </div>
          <div style={styles.footerLinks}>
            <Link to="/forgot-password" style={styles.link}>Forgot Password?</Link>
            <Link to="/signup" style={styles.signupLink}>Sign Up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", padding: "20px" },
  formCard: { backgroundColor: "white", padding: "48px", borderRadius: "16px", width: "100%", maxWidth: "450px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.05)" },
  heading: { textAlign: "center", fontSize: "28px", fontWeight: "700", color: "#1E293B", marginBottom: "32px" },
  formStack: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column" },
  input: { width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid #000001", fontSize: "14px", outline: "none", boxSizing: "border-box", transition: "all 0.2s" },
  button: { padding: "14px", borderRadius: "8px", border: "none", backgroundColor: "#4F46E5", color: "white", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginTop: "10px", transition: "background-color 0.2s" },
  footerLinks: { display: "flex", justifyContent: "space-between", marginTop: "15px", fontSize: "14px" },
  link: { color: "#5c6e86", textDecoration: "none" },
  signupLink: { color: "#4F46E5", fontWeight: "600", textDecoration: "none" },
  socialContainer: { gridColumn: "1 / -1", display: "flex", gap: "12px" },
  socialButton: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", borderRadius: "30px", border: "1px solid #000000", backgroundColor: "white", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#334155", transition: "background-color 0.2s" },
  icon: { width: "18px", height: "18px" },
  error: { color: "#EF4444", fontSize: "11px", marginTop: "4px", fontWeight: "500" },
};
