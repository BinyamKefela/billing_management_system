import Link from "next/link";
import React, { useState } from 'react';


export default function SideBar(){

return(
    // The main container for your dashboard layout
    <div className="flex h-screen bg-gray-100 font-inter">
      {/* Side Navigation Bar - uses its own internal state */}
      <SideNav />

      {/* Main content area, where page content will be rendered */}
      <main className="flex p-8 overflow-y-auto justify-center">
        
      </main>
    </div>
);
}


  function SideNav() {
    const [isCollapsed, setIsCollapsed] = useState(false);
  
    const toggleSidebar = () => {
      setIsCollapsed(!isCollapsed);
    };
  
    // Navigation items for the sidebar
    const navItems = [
      { name: 'Dashboard', icon: 'fas fa-chart-line', href: '/' },
      { name: 'Staff', icon: 'fas fa-users', href: '/staff' },
      { name: 'login', icon: 'fas fa-file-alt', href: '/auth/login' },
      { name: 'forgot password', icon: 'fas fa-cog', href: '/auth/forgot-password' },
      {name:'promoters',icon: 'fas fa-cog', href:'/staff'},
      {name:'transactions',icon: 'fas fa-cog', href:'/staff'},
      {name:'commision configuration',icon: 'fas fa-cog', href:'/staff'},
      {name:'products',icon: 'fas fa-cog', href:'/staff'},
      {name:'housing',icon: 'fas fa-cog', href:'/staff'},
      {name:'sales',icon: 'fas fa-cog', href:'/staff'},
      {name:'new',icon: 'fas fa-cog', href:'/staff'}
    ];
  
    return (
      <div
        className={`relative h-full bg-orange-600 text-white transition-all duration-300 ease-in-out 
          ${isCollapsed ? 'w-20' : 'w-50'} flex flex-col rounded-r-xl shadow-lg`}
      >
        {/* Collapse/Expand Button positioned absolutely */}
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 p-2 rounded-full bg-orange-700 hover:bg-orange-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 z-10"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={`fas ${isCollapsed ? 'fa-arrow-right' : 'fa-arrow-left'} text-lg`}></i>
        </button>
  
        {/* Logo or Dashboard Title */}
        <div className={`p-4 mt-10 mb-1 ${isCollapsed ? 'text-center' : ''}`}>
          {isCollapsed ? (
            <i className="fas fa-cubes text-3xl"></i>
          ) : (
            <h2 className="text-lg font-bold">ANT Network</h2>
          )}
        </div>
  
        <nav className="flex-1 mt-1 overflow-y-auto bg-orange-600 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-orange-500">
          <ul>
            {navItems.map((item) => (
              <li key={item.name} className="mb-1">
                <Link
                  href={item.href}
                  className={`flex items-center p-2 rounded-lg mx-3 hover:bg-orange-700 transition-colors duration-200 
                    ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <i className={`${item.icon} text-lg ${!isCollapsed && 'mr-4'}`}></i>
                  {!isCollapsed && <span className="text-sm">{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
  
        {/* Footer or User Information Section */}
        <div className={`p-6 border-t border-orange-500 ${isCollapsed ? 'text-center' : ''}`}>
          {isCollapsed ? (
            <i className="fas fa-user-circle text-2xl"></i>
          ) : (
            <p className="text-sm">User: John Doe</p>
          )}
        </div>
      </div>
    );
  }
