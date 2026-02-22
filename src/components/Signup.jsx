import React from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import bgImage from "../assets/img/E-auction-bg.png";

export const Signup = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm();

  const selectedRole = watch("role");
  const passwordValue = watch("password");

  const onSubmit = (data) => {
    console.log(data);

    Swal.fire({
      icon: "success",
      title: "Registration Successful",
      text: "Welcome to E-Auction Platform!",
      confirmButtonColor: "#2563eb",
    });

    reset();
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleSubmit(onSubmit)}>
        

        <h2 style={styles.heading}>Sign up</h2>

        {/* Full Name */}
        <div>
        <input
          type="text"
          placeholder="Full Name"
          style={styles.input}
          {...register("fullname", {
            required: "Full Name is required",
            minLength: {
              value: 3,
              message: "Minimum 3 characters required",
            },
          })}
        />
        <p style={styles.error}>{errors.fullname?.message}</p>
        </div>

        {/* Email */}
        <div>
        <input
          type="email"
          placeholder="Email"
          style={styles.input}
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter valid email address",
            },
          })}
        />
        <p style={styles.error}>{errors.email?.message}</p>
        </div>

        {/* Mobile */}
        <div>
        <input
          type="tel"
          placeholder="Mobile Number"
          style={styles.input}
          {...register("mobile", {
            required: "Mobile number is required",
            pattern: {
              value: /^[0-9]{10}$/,
              message: "Enter valid 10 digit mobile number",
            },
          })}
        />
        <p style={styles.error}>{errors.mobile?.message}</p>
        </div>

        {/* Password */}
        <div>
        <input
          type="password"
          placeholder="Password"
          style={styles.input}
          {...register("password", {
            required: "Password is required",
            pattern: {
              value:
                /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
              message:
                "Min 8 chars, 1 uppercase, 1 number, 1 special character",
            },
          })}
        />
        <p style={styles.error}>{errors.password?.message}</p>
        </div>

        {/* Confirm Password */}
        <div>
        <input
          type="password"
          placeholder="Confirm Password"
          style={styles.input}
          {...register("confirmPassword", {
            required: "Confirm Password is required",
            validate: (value) =>
              value === passwordValue || "Passwords do not match",
          })}
        />
        <p style={styles.error}>{errors.confirmPassword?.message}</p>
        </div>

        {/* Role Selection */}
        <div style={{ gridColumn: "1 / span 2" }}>
        <select
          style={styles.input}
          {...register("role", { required: "Select account type" })}
        >
          <option value="">Select Account Type</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>
        <p style={styles.error}>{errors.role?.message}</p>
        

        {/* Seller Extra Fields */}
        {selectedRole === "seller" && (
          <>
            <input
              type="text"
              placeholder="Business Name"
              style={styles.input}
              {...register("businessName", {
                required: "Business Name is required for sellers",
              })}
            />
            <p style={styles.error}>{errors.businessName?.message}</p>

            <input
              type="text"
              placeholder="GST Number"
              style={styles.input}
              {...register("gstNumber", {
                required: "GST Number is required",
              })}
            />
            <p style={styles.error}>{errors.gstNumber?.message}</p>
          </>
        )}
        </div>

        {/* Address */}
        <div style={{ gridColumn: "1 / span 2" }}>
        <input
          type="text"
          placeholder="Address"
          style={styles.input}
          {...register("address", { required: "Address is required" })}
        />
        <p style={styles.error}>{errors.address?.message}</p>
        </div>
    
        <div>
        <input
          type="text"
          placeholder="City"
          style={styles.input}
          {...register("city", { required: "City is required" })}
        />
        <p style={styles.error}>{errors.city?.message}</p>
        </div>

        <div>
        <input
          type="text"
          placeholder="State"
          style={styles.input}
          {...register("state", { required: "State is required" })}
        />
        <p style={styles.error}>{errors.state?.message}</p>
        </div>

        <div>
        <input
          type="text"
          placeholder="Pincode"
          style={styles.input}
          {...register("pincode", {
            required: "Pincode is required",
            pattern: {
              value: /^[0-9]{6}$/,
              message: "Enter valid 6 digit pincode",
            },
          })}
        />
        <p style={styles.error}>{errors.pincode?.message}</p>
        </div>

        {/* Profile Image */}
        <div style={{ gridColumn: "1 / span 2" }}>
        <input
          type="file"
          style={styles.input}
          {...register("profileImage", {
            required: "Profile image is required",
          })}
        />
        <p style={styles.error}>{errors.profileImage?.message}</p>
        </div>

       <div style={{ gridColumn: "1 / span 2" }}>
        <button type="submit" style={styles.button}>
          Register
        </button>
        </div>

      </form>
    </div>
  );
};

const styles = {
 container: {
  minHeight: "90vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundImage: `url(${bgImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  padding: "40px 20px",
  fontFamily: "sans-serif"
},

  form: {
  backgroundColor: "rgba(255, 255, 255, 0.1)", // translucent white
  backdropFilter: "blur(12px)",                 // blur effect
  padding: "50px",
  borderRadius: "16px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
  width: "100%",
  maxWidth: "1000px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "25px",
  border: "1px solid #fff",                     // white border
  borderBottom: "1px solid rgba(255,255,255,0.5)",
  borderRight: "1px solid rgba(255,255,255,0.5)",
},

  heading: {
    gridColumn: "1 / -1",   // 👈 Full width
    textAlign: "center",
    fontSize: "28px",
    fontWeight: "600",
    color: "black",
    marginBottom: "10px",
  },

  input: {
    width: "100%",          // 👈 VERY IMPORTANT
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #374151",
    backgroundColor: "#1f2937",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
  },

 button: {
  width: "100%",              // ✅ full width
  gridColumn: "1 / -1",
  padding: "15px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#2563eb",
  color: "white",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
  marginTop: "10px",
},

  error: {
    color: "#f87171",
    fontSize: "12px",
    marginTop: "5px",
  },
};