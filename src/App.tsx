import { BrowserRouter, Routes, Route } from "react-router-dom";
import NormPrototype from "./components/NormPrototype";

const basename = import.meta.env.PROD ? "/norm-ai-assistant-v2" : "";

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<NormPrototype />} />
      </Routes>
    </BrowserRouter>
  );
}
