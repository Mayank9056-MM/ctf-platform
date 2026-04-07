

import DashboardPage from "@/modules/dashboard/components/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — CTF Platform",
  description: "Your personal CTF command centre.",
};

export default function Page() {
  return <DashboardPage />;
}