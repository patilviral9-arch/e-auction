import React from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import bgImage from "../assets/img/E-auction-bg.png";

export const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

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
        value: 8,
        message: "Minimum 8 characters required *",
      },
    },
  };

  const submithandler = (data) => {
    Swal.fire({
      icon: "success",
      title: "Login Successful",
      confirmButtonColor: "#f43f5e",
    });

    reset();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url(${bgImage})`,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      {/* SMALL CARD - NOT FULL WIDTH */}
      <div className="w-[500px] h-[520px] bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-10 font-['sans-serif']" 
      style={{ 
        border: "1px solid #fff",
         borderBottom: "1px solid rgba(255,255,255,0.5)",
          borderRight: "1px solid rgba(255,255,255,0.5)", 
          borderRadius: "20px",
           }} >
        
        <h2 className="text-4xl font-extrabold text-black text-center mb-10 tracking-wide">
            Sign In
       </h2>
        
        <div className="backdrop-blur-[15px] ">
        <form onSubmit={handleSubmit(submithandler)} className="space-y-5">
          
          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Enter Email"
              {...register("email", validationschema.email)}
              className="w-full p-3 rounded-lg bg-slate-800 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-red-600 text-sm mt-1">
              {errors.email?.message}
            </p>
          </div>
             
           

          {/* Password */}
          <div>
            <input
              type="password"
              placeholder="Enter Password"
              {...register("password", validationschema.password)}
              className="w-full p-3 rounded-lg bg-slate-800 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-red-700 text-sm mt-1">
              {errors.password?.message}
            </p>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 transition duration-300 text-white font-semibold py-3 rounded-lg"
          >
            Login
          </button>
          
          {/* Bottom Links */}
        <div className="flex justify-between mt-3 text-base font-semibold">
        <a
            href="/forgot-password"
            className="text-black hover:text-red-500 transition duration-300"
          >
            Forget Password
          </a>

          <a
            href="/signup"
            className="text-black underline hover:text-red-500 transition duration-300"
            >
            Sign Up
          </a>

        </div>
        </form>

        </div>

      </div>
    </div>
  );
};