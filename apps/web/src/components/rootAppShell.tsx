"use client";

import { AppShell } from "@mantine/core";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import RootSidebar from "./rootSidebar";
import { nprogress } from "@mantine/nprogress";
import { AuthProvider } from "./auth/authProvider";

const RootAppShell = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const path = usePathname();

  useEffect(() => {
    nprogress.start();
    nprogress.set(30);
    setTimeout(() => {
      nprogress.set(60);
    }, 500);
    setTimeout(() => {
      nprogress.complete();
    }, 1000);
    () => {
      nprogress.start();
    };
  }, [path]);

  if (
    path.startsWith("/editor") ||
    path.startsWith("/login") ||
    path.startsWith("/new_homepage") ||
    path.startsWith("/new_project")
  )
    return <AuthProvider>{children}</AuthProvider>;

  return (
    <AppShell
      navbar={{
        width: "15%",
        breakpoint: "xs",
      }}
    >
      <AuthProvider>
        <AppShell.Navbar>
          <RootSidebar />
        </AppShell.Navbar>
        <AppShell.Main>
          {children}
        </AppShell.Main>
      </AuthProvider>
    </AppShell>
  );
};

export default RootAppShell;
