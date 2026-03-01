import { BrowserRouter, Routes, Route } from "react-router-dom";
import LobbyPage from "./pages/LobbyPage";
import GamePage from "./pages/GamePage";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Main App component that sets up routing for the application, directing users to the LobbyPage or GamePage based on the URL path.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route
          path="/game"
          element={
            <ErrorBoundary>
              <GamePage />
            </ErrorBoundary>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
