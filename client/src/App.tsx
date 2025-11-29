import { BrowserRouter, Route, Routes } from "react-router";

import HomePage from "./pages/Home";
import NotFoundPage from "./pages/NotFound";
import PageExample from "./pages/Page1";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/example" element={<PageExample />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
