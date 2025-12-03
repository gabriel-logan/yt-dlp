import { BrowserRouter, Route, Routes } from "react-router";

import { Layout } from "./components/Layout";
import HomePage from "./pages/Home";
import NotFoundPage from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
