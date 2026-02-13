import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import Landing from "./pages/Landing";
import Lobby from "./pages/Lobby";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes for code splitting
const VideoChat = React.lazy(() => import("./pages/VideoChat"));
const Games = React.lazy(() => import("./pages/Games"));
const GamePlay = React.lazy(() => import("./pages/GamePlay"));

const PageLoader = () => (
  <div className="h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-primary text-lg font-display">Loading...</div>
  </div>
);

const App = () => (
  <TooltipProvider>
    <AppProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/chat" element={<VideoChat />} />
            <Route path="/chat/:odId" element={<VideoChat />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/:gameId" element={<GamePlay />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  </TooltipProvider>
);

export default App;
