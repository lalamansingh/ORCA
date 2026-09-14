import "./mobile.css";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#040812", color: "#f8fafc" }}>
      {children}
    </div>
  );
}
