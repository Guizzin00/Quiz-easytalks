import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Quiz from './Quiz';
import Admin from './Admin';
import Ranking from './Ranking';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Quiz />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/ranking" element={<Ranking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
