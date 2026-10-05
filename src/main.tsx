import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const target = document.getElementById('interactive-overlay-root') || document.getElementById('root')!;
createRoot(target).render(<App />);
