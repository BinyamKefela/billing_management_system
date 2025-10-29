"use client"

import * as React from "react"
import {
  Antenna,
  AntennaIcon,
  BookOpen,
  Bot,
  BoxIcon,
  BrickWall,
  Command,
  CreditCardIcon,
  DollarSign,
  Frame,
  GalleryVerticalEnd,
  LogOutIcon,
  LucidePieChart,
  Map,
  Package2Icon,
  PenBoxIcon,
  PersonStanding,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"


import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavNetworking } from "./nav-networking"
import Cookies from "js-cookie"

const data = {
  user: {
    name: Cookies.get("first_name")?.toString()+" "+Cookies.get("last_name") || "Binyam Kefela",
    email: Cookies.get("email") || "binyamkefela@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Kacha Billing System",
      logo: DollarSign,
      plan: "management system",
    },
    {
      name: "Kacha Billing System",
      logo: Antenna,
      plan: "",
    },
    {
      name: "Kacha Billing System",
      logo: Command,
      plan: "",
    },
  ],
  navMain: [
    {
      title: "promoters",
      url: "#",
      icon: SquareTerminal,
      //isActive: false,
      
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  settings: [
    {name:"Dashboard",
      url:"/dashboard",
      icon:LucidePieChart
    },
    {name:"users",
      url:"/dashboard/users",
      icon:PersonStanding
    },
    {
      name:"groups",
      url: "/dashboard/group",
      icon: GalleryVerticalEnd,
    },
    {
      name:"permissions",
      url: "/dashboard/permission",
      icon: GalleryVerticalEnd,
    },
    {
      name: "customers",
      url: "/dashboard/customer",
      icon: Frame,
    },
    {name:"billers",
      url:"/dashboard/biller",
      icon:BoxIcon
    },
    
    {name:"bills",
      url:"/dashboard/bill",
      icon:PenBoxIcon
    },
    {
      name: "payments",
      url: "/dashboard/payment",
      icon: Package2Icon,
    },
    {
      name: "notifications",
      url: "/dashboard/notification",
      icon: Package2Icon,
    },
    {name:"biller reports",
      url:"/dashboard/biller_dashboard",
      icon:Settings2
    },
    
    
    
    {name:"logout",
      url:"#",
      icon:LogOutIcon,
      onClick: () => {
        Cookies.remove("token")
        window.location.href = "/auth/login"
      }
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={
          data.teams
        } />
      </SidebarHeader>
      <SidebarContent>
        
        <NavNetworking items={data.settings}/>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
