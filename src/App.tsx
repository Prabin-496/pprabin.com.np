import React, { useState } from 'react';
import Projects from './components/Portfolio';
import './index.css';

const App = () => {
  return (
    <div className="site-shell text-[var(--ink)]">
      <Projects />
    </div>
  );
};

export default App;
