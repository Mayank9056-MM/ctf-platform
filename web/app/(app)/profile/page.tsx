import MyProfilePage from "@/modules/users/components/user/profile/MyProfilePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile — CTF Platform",
  description: "Manage your account, security, and view your stats.",
};

export default function Page() {
  return <MyProfilePage />;
}
