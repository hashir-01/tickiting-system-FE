'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"; 
import { 
  User, 
  Ticket, 
  Zap, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Settings, 
  Menu 
} from 'lucide-react';

interface SidebarProps {
  employeeInfo: {
    name: string;
    role: string;
    dept: string;
  };
}

export default function Sidebar({ employeeInfo }: SidebarProps) {
  const pathname = usePathname();
  const normalizedRole = employeeInfo.role?.toUpperCase();

  const isActive = (path: string) => pathname === path;

  const navItemClasses = (path: string) => `
    flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-150 group
    ${isActive(path) 
      ? 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-sm shadow-green-950/50' 
      : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-100'
    }
  `;

  const NavLink = ({ href, icon: Icon, label, closeMenu }: { href: string; icon: any; label: string; closeMenu?: () => void }) => (
    <Link href={href} className={navItemClasses(href)} onClick={closeMenu}>
      <Icon className={`h-4 w-4 transition-colors duration-150 ${isActive(href) ? 'text-green-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
      {label}
    </Link>
  );

  const renderNavLinks = (closeMenu?: () => void) => {
    const links = {
      SUPER_ADMIN: [
        { href: "/portal/super-admin", icon: User, label: "My Profile" },
        { href: "/portal/my-tickets", icon: Ticket, label: "My Tickets" },
        { href: "/portal/pending-actions", icon: Zap, label: "Pending Actions" },
        { href: "/portal/my-performance", icon: TrendingUp, label: "My Performance" },
        { href: "/portal/super-admin/manage-departments", icon: Users, label: "Manage Departments" },
        { href: "/portal/all-departments-progress", icon: BarChart3, label: "View Progress Report" },
        { href: "/portal/change-password", icon: Settings, label: "Settings" },
      ],
      MANAGER: [
        { href: "/portal/IAM", icon: User, label: "My Profile" },
        { href: "/portal/my-tickets", icon: Ticket, label: "My Tickets" },
        { href: "/portal/pending-actions", icon: Zap, label: "Pending Actions" },
        { href: "/portal/my-performance", icon: TrendingUp, label: "My Performance" },
        { href: "/portal/manager-view-progress", icon: Users, label: "View Progress" },
        { href: "/portal/change-password", icon: Settings, label: "Settings" },
      ],
      IAM: [
        { href: "/portal/IAM", icon: User, label: "My Profile" },
        { href: "/portal/my-tickets", icon: Ticket, label: "My Tickets" },
        { href: "/portal/pending-actions", icon: Zap, label: "Pending Actions" },
        { href: "/portal/my-performance", icon: TrendingUp, label: "My Performance" },
        { href: "/portal/IAM/manage-accounts", icon: Users, label: "Manage Accounts" },
        { href: "/portal/change-password", icon: Settings, label: "Settings" },
      ],
      DEFAULT: [
        { href: "/portal/employee", icon: User, label: "My Profile" },
        { href: "/portal/my-tickets", icon: Ticket, label: "My Tickets" },
        { href: "/portal/pending-actions", icon: Zap, label: "Pending Actions" },
        { href: "/portal/my-performance", icon: TrendingUp, label: "My Performance" },
        { href: "/portal/change-password", icon: Settings, label: "Settings" },
      ]
    };

    const currentLinks = links[normalizedRole as keyof typeof links] || links.DEFAULT;

    return currentLinks.map((link, idx) => (
      <NavLink key={idx} href={link.href} icon={link.icon} label={link.label} closeMenu={closeMenu} />
    ));
  };

  const ProfileBadge = () => (
    <div className="p-4 bg-black/40 rounded-2xl border border-slate-900 space-y-4 flex flex-col items-center text-center backdrop-blur-md">
      <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-green-500/40 bg-slate-900 shadow-md shadow-black/60">
        <Image 
          src="/unknowndp.jpg" 
          alt="User Profile Display Avatar"
          fill
          sizes="64px"
          priority
          className="object-cover"
        />
      </div>

      <div className="space-y-1 w-full">
        <h3 className="font-black text-xs text-slate-200 truncate tracking-tight uppercase">
          {employeeInfo.name}
        </h3>
        <div>
          <p className="text-[10px] font-extrabold text-green-400 uppercase tracking-widest">
            Role: {employeeInfo.role}
          </p>
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide truncate mt-0.5">
            Dept: {employeeInfo.dept}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 📱 MOBILE TOP FLOATING BAR */}
      <div className="md:hidden w-full bg-slate-950 border-b border-slate-900 p-4 flex justify-between items-center sticky top-0 z-40 shrink-0">
        <span className="text-xs font-black tracking-widest uppercase text-slate-200">TicketFlow</span>
        
        <Sheet>
          <SheetTrigger className="p-2 text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-800 rounded-xl transition-all active:scale-95 cursor-pointer">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          
          <SheetContent side="left" className="p-5 w-64 bg-gradient-to-b from-black via-slate-950 to-green-950 text-slate-100 border-r border-slate-900 flex flex-col justify-between">
            <SheetHeader className="text-left hidden">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-4">
              <ProfileBadge />
              <nav className="flex flex-col space-y-1">
                {renderNavLinks()}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 💻 DESKTOP FIXED SIDEBAR */}
      {/* 🛠️ ULTIMATE FIX 4: h-full ke sath 'overflow-y-auto' kiya taake nested structure break na ho */}
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-black via-slate-950 to-green-950 border-r border-slate-900 p-5 flex-col select-none shrink-0 h-full gap-6 overflow-y-auto custom-scrollbar">
        <ProfileBadge />
        <nav className="flex flex-col space-y-1">
          {renderNavLinks()}
        </nav>
      </aside>
    </>
  );
}