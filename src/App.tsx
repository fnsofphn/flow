import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Memories from './pages/Memories';
import Todo from './pages/Todo';
import DatePlanner from './pages/DatePlanner';
import TradingHub from './pages/TradingHub';
import DreamAI from './pages/DreamAI';
import EmotionalMemory from './pages/EmotionalMemory';
import TravelSystem from './pages/TravelSystem';
import NannyContract from './pages/NannyContract';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/memories" element={<Memories />} />
          <Route path="/todo" element={<Todo />} />
          <Route path="/date-planner" element={<DatePlanner />} />
          <Route path="/trading" element={<TradingHub />} />
          <Route path="/dream-ai" element={<DreamAI />} />
          <Route path="/emotional-memory" element={<EmotionalMemory />} />
          <Route path="/travel" element={<TravelSystem />} />
          <Route path="/contract" element={<NannyContract />} />
        </Routes>
      </Layout>
    </Router>
  );
}
