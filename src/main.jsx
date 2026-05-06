// ✅ 18TH-A1: React.StrictMode는 명시적 객체 참조이므로 import 필수 — JSX transform과 별개
import React from 'react';
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
