import type { Metadata } from "next";
import { ProfileForm } from "@/app/profile/ProfileForm";

export const metadata: Metadata = {
  title: "Your profile",
  description:
    "Choose a persona and region to tailor local notes and actions on the feed.",
};

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Choose a persona and region so the feed and event pages can show
          relevant local notes and action lists.
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
