import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import { BookDetailPage } from './pages/BookDetailPage';
import { BookSearchPage } from './pages/BookSearchPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/:id" element={<BookDetailPage />} />
        <Route path="/search/:title" element={<BookSearchPage />} />
      </Routes>
    </Router>
  );
}

export default App;