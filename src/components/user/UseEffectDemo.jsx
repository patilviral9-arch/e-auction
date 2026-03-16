// import React, { useEffect, useState } from 'react'
// import { Outlet } from 'react-router-dom'

// export const UseEffectDemo = () => {
//     const [count, setcount] = useState(0)
//     // useEffect(()=>{
//     //     console.log("use effect called...")
//     // },[])

//     useEffect(()=>{
//         console.log("use effect called...")
//     },[count]) 
//     //[count] --> if any changes happens with count variable useEffect will call again..
//     //()=>{} call back function
//     //[] --> depedancy array


//   return (
//     <div style={{textAlign:"center"}}>
//         <h1>UseEffectDemo</h1>
//         <button onClick={()=>{setcount(count+1)}}>Increment</button>
//         <p>Count: {count}</p>
//         <Outlet/>
//     </div>
//   )
// }