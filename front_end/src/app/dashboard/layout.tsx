"use client"; // <--- Add this line

import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { Link, LogOutIcon } from "lucide-react";
import { useRouter } from 'next/navigation';
import { logoutUser } from "../auth/login/api";


export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  const handleLogout = () => {
    logoutUser();
    // Redirect the user after they have been logged out.
    router.push('/auth/login');
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex w-full flex-col ">
          <div className="h-16 flex items-stretch gap-10">
            <div className="flex items-center gap-3 px-4">
            <SidebarTrigger className="cursor-pointer" />
            {/*<ModeToggle/>*/}
            <div className="items-center py-4 justify-end cursor-pointer" onClick={handleLogout}>
            <LogOutIcon/>
          </div>
            <h3 className=" cursor-pointer font-medium hover:text-blue-500">Kacha Billing Management system</h3>
            </div>
          

          </div>
          <div className=" bg-gray-500">
            <hr />
          </div>
          
          <div className="flex flex-col w-full mt-5">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}