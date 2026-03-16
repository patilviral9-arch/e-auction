// import axios from "axios";
// import React, { useEffect, useState } from "react";
// import { Outlet } from "react-router-dom";
// import { toast } from "react-toastify";

// export const GetApiDemo = () => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const deleteUser = async (id) => {
//     const res = await axios.delete(`https://node5.onrender.com/user/user/${id}`);
//     console.log(res);
//     getUsers();
//     toast.success("User Deleted Successfully");
//   }

//   const getUsers = async () => {
//     try {
//       const res = await axios.get("https://node5.onrender.com/user/user/");
//       setUsers(res?.data?.data || []);
//     } 
//     catch (err) {
//       console.error(err);
//       setError("Failed to fetch users");
//     } 
//     finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {getUsers();}, []);

//   return (
//     <div className="min-h-screen bg-gray-100 p-6">
//       <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
//         GET API DEMO
//       </h1>

//       {loading && (
//         <p className="text-center text-blue-600 font-semibold">
//           Loading...
//         </p>
//       )}

//       {error && (
//         <p className="text-center text-red-600 font-semibold">
//           {error}
//         </p>
//       )}

//       {!loading && users.length === 0 && (
//         <p className="text-center text-gray-600 font-medium">
//           No Users Found*
//         </p>
//       )}

//       {users.length > 0 && (
//         <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
//           <table className="min-w-full text-sm text-left">
//             <thead className="bg-slate-800 text-white uppercase text-xs tracking-wider">
//               <tr>
//                 <th className="px-6 py-3">ID</th>
//                 <th className="px-6 py-3">Name</th>
//                 <th className="px-6 py-3">Email</th>
//                 <th className="px-6 py-3">Delete</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-gray-200">
//               {users.map((user) => (
//                 <tr
//                   key={user._id}
//                   className="hover:bg-gray-100 transition duration-200"
//                 >
//                   <td className="px-6 py-4 text-gray-700">
//                     {user._id}
//                   </td>
//                   <td className="px-6 py-4 font-medium text-gray-900">
//                     {user.name}
//                   </td>
//                   <td className="px-6 py-4 text-gray-700">
//                     {user.email}
//                   </td>
//                   <td>
//                   <button onClick={()=>{deleteUser(user._id)}} className='text-red-500 cursor-pointer font-semibold'>Delete</button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       <Outlet />
//     </div>
//   );
// };