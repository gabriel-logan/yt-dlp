import { BrowserRouter, Route, Routes } from "react-router";

import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { PageWrapper } from "./components/PageWrapper";
import HomePage from "./pages/Home";
import NotFoundPage from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <PageWrapper>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Footer />
      </PageWrapper>
    </BrowserRouter>
  );
}

export default App;
