import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('=== APP IS WORKING - CLEAR YOUR BROWSER CACHE ===');
console.log('=== MAIN.TSX IS LOADING ===');
console.log('Current timestamp:', new Date().toISOString());

createRoot(document.getElementById("root")!).render(<App />);
