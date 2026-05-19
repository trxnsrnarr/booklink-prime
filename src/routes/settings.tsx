import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
export const Route = createFileRoute("/settings")({ component: () => (
  <div className="mx-auto max-w-2xl px-6 py-16 text-center glass-strong rounded-3xl mt-10 mx-4">
    <SettingsIcon className="mx-auto h-10 w-10 text-primary" />
    <h1 className="mt-4 font-display text-2xl font-semibold">Settings</h1>
    <p className="mt-2 text-sm text-muted-foreground">Pengaturan akun & preferensi akan tersedia segera.</p>
  </div>
)});
