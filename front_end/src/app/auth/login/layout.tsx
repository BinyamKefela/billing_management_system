'use client'
import SideBar from "@/components/ui/side_nav"
import React from "react";

export default function Layout({children}:{children:React.ReactNode}){
  return(
    <html lang="en" className="no-root-layout">
      <body>
    <div className="flex justify-center h-screen bg-gray-100 font-inter">
          
            <main className="flex p-25  justify-center items-center h-full">
                
            {children}
          </main>
        </div>
        </body>
        </html>);
}
