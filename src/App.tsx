import { Routes, Route } from "react-router-dom";
import Curtains from "./components/Curtains";
import BottomNav from "./components/BottomNav";
import MigrationPrompt from "./components/MigrationPrompt";
import Home from "./pages/Home";
import CalendarPage from "./pages/CalendarPage";
import EventsList from "./pages/EventsList";
import EventForm from "./pages/EventForm";
import EventDetail from "./pages/EventDetail";
import Subscriptions from "./pages/Subscriptions";
import SubscriptionForm from "./pages/SubscriptionForm";
import Memories from "./pages/Memories";
import Statistics from "./pages/Statistics";
import Settings from "./pages/Settings";
import AuthScreen from "./pages/AuthScreen";
import ResetPassword from "./pages/ResetPassword";
import { useAuth } from "./store/AuthStore";

function ConfigNotice() {
  return (
    <div className="auth-wrap">
      <div className="auth-card fade-in">
        <img className="auth-logo" src="/LOGO.jpg" alt="SHOW TIME" />
        <h2 className="center" style={{ fontSize: "1.15rem" }}>נדרשת הגדרת Supabase</h2>
        <p className="muted center">
          עדכנו את הקובץ <code>.env.local</code> עם הערכים{" "}
          <code dir="ltr">NEXT_PUBLIC_SUPABASE_URL</code> ו-
          <code dir="ltr">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> והריצו מחדש.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const { session, loading, configured, recovery } = useAuth();

  if (!configured) {
    return (
      <div className="app-shell">
        <div className="valance" aria-hidden />
        <Curtains />
        <ConfigNotice />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="valance" aria-hidden />
      <Curtains />

      {loading ? (
        <div className="spinner" aria-label="טוען" />
      ) : recovery ? (
        <ResetPassword />
      ) : !session ? (
        <AuthScreen />
      ) : (
        <>
          <main className="app-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/events" element={<EventsList />} />
              <Route path="/events/new" element={<EventForm />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/events/:id/edit" element={<EventForm />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/subscriptions/new" element={<SubscriptionForm />} />
              <Route path="/subscriptions/:id/edit" element={<SubscriptionForm />} />
              <Route path="/memories" element={<Memories />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
          <BottomNav />
          <MigrationPrompt />
        </>
      )}
    </div>
  );
}
