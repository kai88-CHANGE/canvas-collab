import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import CanvasEditor from './pages/CanvasEditor';
import './App.css';

export default function App() {
  const { user, setUser } = useAuth();
  const [activeCanvas, setActiveCanvas] = useState(null);

  if (user === undefined) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (activeCanvas) {
    return (
      <CanvasEditor
        canvasId={activeCanvas}
        user={user}
        onBack={() => setActiveCanvas(null)}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      setUser={setUser}
      onSelectCanvas={setActiveCanvas}
    />
  );
}
