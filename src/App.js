// src/App.js — Router + shell + FAB
import React, { useState, useCallback, Suspense } from 'react';
import { HomePage } from './pages/HomePage';
import { DrugDetailPage } from './pages/DrugDetailPage';
import { DrugDetailSkeleton } from './components/ui/Skeleton';
import { DoseCalculatorFAB } from './components/calculator/DoseCalculator';
import { useDrugs } from './hooks/useDrugData';
import './styles/globals.css';

function AppShell() {
  const [selectedDrug, setSelectedDrug] = useState(null);
  const drugs = useDrugs();

  const handleDrugSelect = useCallback((drug) => {
    setSelectedDrug(drug);
    window.scrollTo({ top: 0, behavior: 'instant' });
    window.history.pushState({ drug: drug.drug_name }, '', `#${encodeURIComponent(drug.drug_name)}`);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedDrug(null);
    window.history.back();
  }, []);

  React.useEffect(() => {
    const handlePopState = () => {
      if (!window.location.hash) setSelectedDrug(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <>
      <Suspense fallback={<DrugDetailSkeleton />}>
        {selectedDrug ? (
          <DrugDetailPage
            key={selectedDrug.drug_name}
            drug={selectedDrug}
            onBack={handleBack}
          />
        ) : (
          <HomePage onDrugSelect={handleDrugSelect} />
        )}
      </Suspense>

      {/* Global floating dose calculator FAB */}
      <DoseCalculatorFAB drugs={drugs} />
    </>
  );
}

function App() {
  return <AppShell />;
}

export default App;
