import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/components/auth-provider";
import { ProtectedRoute } from "@/components/protected-route";
import "./platform.css";
import "./views.css";
import "./tools.css";
import "./status.css";
import "./profile.css";
import "./map-v2.css";
import "./conditions.css";
import "./alerts.css";
import "./subscriptions.css";
export default function PlatformLayout({children}:{children:React.ReactNode}) {return <AuthProvider><ProtectedRoute><AppShell>{children}</AppShell></ProtectedRoute></AuthProvider>}
