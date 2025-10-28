"use client";
import { useState } from "react";

export default function UserModal({IsOpen,children,title}: {IsOpen:boolean,children:any,title:string}) {
  const [isOpen, setIsOpen] = useState(IsOpen);

  return (
    <div >
      {/* Create Butt on */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 whitespace-nowrap"
      >
       + Create New
      </button>

      {/* Overlay + Modal */}
      {isOpen && (
        <div className="fixed inset-0   bg-opacity-50 flex items-center justify-center z-50">
          {/* Modal Container */}
          <div className=" bg-gray-50 rounded-2xl shadow-lg w-full max-w-md p-1 animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-xl font-semibold">Create User</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-800 bg-gray border-1 p-1 text-sm rounded-md"
              >
                close
              </button>
            </div>

            {/* Form */}
            {children}
          </div>
        </div>
      )}

      {/* Simple Tailwind animation */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
