import { createRoot } from 'react-dom/client'
// import App from './App.tsx'
import './index.css'

console.log('=== EMERGENCY DEBUG MODE ===');
console.log('=== MAIN.TSX IS LOADING ===');
console.log('Current timestamp:', new Date().toISOString());

// Simple test component to verify React works
function TestApp() {
  console.log('=== TEST APP RENDERING ===');
  return (
    <div style={{ 
      padding: '50px', 
      fontSize: '24px', 
      color: 'red', 
      fontWeight: 'bold',
      background: 'yellow'
    }}>
      <h1>EMERGENCY TEST - REACT WERKT</h1>
      <p>Als je dit ziet, werkt React basis</p>
      <p>Timestamp: {new Date().toISOString()}</p>
      <button onClick={() => alert('JavaScript werkt!')}>Test JS</button>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<TestApp />);
