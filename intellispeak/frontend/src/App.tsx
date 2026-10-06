import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import AnalysisPage from "./pages/AnalysisPage";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8">Loading…</p>;
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route element={user ? <AppLayout /> : <Navigate to="/" replace />}>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
