import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Login } from "../components/Login";
import { Signup } from "../components/Signup";
import { AdminSidebar } from "../components/admin/Adminsidebar";
import { AdminLayout } from "../components/admin/AdminLayout";
import { UserNavbar } from "../components/user/UserNavbar.jsx";

const router = createBrowserRouter([
    {path:"/",element:<Login/>},
    {path:"signup",element:<Signup/>},

     {
        path:"/admin",element:<AdminSidebar/>,
        path:"/admin",element:<AdminLayout/>,
     },

     {
        path:"/user", element:<UserNavbar/>
     }
    
])


const AppRouter = ()=>{
    return <RouterProvider router={router}></RouterProvider>
}
export default AppRouter