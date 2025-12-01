import type { Metadata } from "next";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/nprogress/styles.css";
import "../index.css";

import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import RootAppShell from "@/components/rootAppShell";
import QueryProvider from "../query/queryProvider";
import { Notifications } from "@mantine/notifications";
import { NavigationProgress } from "@mantine/nprogress";
import { authClient } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Configurable Backend Engine",
  description: "CBE Console",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headersList = await headers();
  const referer = headersList.get("Referer") || "";
  const url = new URL(referer);
  const pathname = url.pathname;
  const session = await authClient.getSession({
    fetchOptions: { headers: headersList },
  });
  if (!session.data?.user && pathname !== "/_/admin/ui/login") {
    redirect("/login");
  }

  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          <Notifications />
          <QueryProvider>
            <NavigationProgress color="violet" size={2} />
            <RootAppShell>{children}</RootAppShell>
          </QueryProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
