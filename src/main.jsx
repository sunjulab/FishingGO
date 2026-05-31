// ✅ 18TH-A1: React.StrictMode는 명시적 객체 참조이므로 import 필수 — JSX transform과 별개
import React from 'react';
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// ✅ PRELOADER: React 마운트 완료 후 로딩 화면 제거
const preloader = document.getElementById('app-preloader');
if (preloader) {
  preloader.style.transition = 'opacity 0.3s';
  preloader.style.opacity = '0';
  setTimeout(() => preloader.remove(), 300);
}
