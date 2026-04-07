import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import './hospital-finder.css';
import AppNavbar from './components/AppNavbar';
import AppFooter from './components/AppFooter';
import LandingPage from './pages/LandingPage';
import HospitalsPage from './pages/HospitalsPage';
import HospitalDetailPage from './pages/HospitalDetailPage';
import ComparePage from './pages/ComparePage';
import RecommendPage from './pages/RecommendPage';
import MapPage from './pages/MapPage';
import Chatbot from './components/Chatbot';
import { createSelectionPreview } from './utils/hospitalUi';

function readStoredCompareList() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem('hospital-finder-compare');
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

export default function App() {
  const [compareList, setCompareList] = useState(readStoredCompareList);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('hospital-finder-compare', JSON.stringify(compareList));
    }
  }, [compareList]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const toggleCompare = (hospital) => {
    setCompareList((current) => {
      const exists = current.some((item) => item.id === hospital.id);

      if (exists) {
        setToast(`${hospital.name} removed from compare`);
        return current.filter((item) => item.id !== hospital.id);
      }

      if (current.length >= 3) {
        setToast('You can compare up to 3 hospitals');
        return current;
      }

      setToast(`${hospital.name} added to compare`);
      return [...current, createSelectionPreview(hospital)];
    });
  };

  const removeCompare = (hospital) => {
    setCompareList((current) => current.filter((item) => item.id !== hospital.id));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppNavbar compareCount={compareList.length} />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/hospitals"
          element={<HospitalsPage compareList={compareList} onCompareToggle={toggleCompare} />}
        />
        <Route
          path="/hospitals/:id"
          element={<HospitalDetailPage compareList={compareList} onCompareToggle={toggleCompare} />}
        />
        <Route
          path="/map"
          element={<MapPage compareList={compareList} onCompareToggle={toggleCompare} />}
        />
        <Route
          path="/compare"
          element={(
            <ComparePage
              compareList={compareList}
              onCompareToggle={toggleCompare}
              onClearCompare={clearCompare}
              onRemoveCompare={removeCompare}
            />
          )}
        />
        <Route path="/recommend" element={<RecommendPage />} />
      </Routes>

      <AppFooter />
      <Chatbot />

      <div className={`toast-shell ${toast ? 'show' : ''}`}>{toast}</div>
    </BrowserRouter>
  );
}
