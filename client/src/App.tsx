import { BrowserRouter, Route, Routes } from "react-router";

import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import HomePage from "./pages/Home";
import NotFoundPage from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
