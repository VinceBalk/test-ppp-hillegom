import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('=== APP IS WORKING - CLEAR YOUR BROWSER CACHE ===');

createRoot(document.getElementById("root")!).render(<App />);
