import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const wave = document.createElement('div')
wave.id = 'folio-wave'
wave.innerHTML = `
  <svg class="wl wl3" viewBox="0 0 1200 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wg3" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#f5c842" stop-opacity="0"/>
        <stop offset="30%"  stop-color="#f7d060" stop-opacity="1"/>
        <stop offset="70%"  stop-color="#e8994a" stop-opacity="1"/>
        <stop offset="100%" stop-color="#f5c842" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="M0,180 C150,120 250,200 400,160 S650,80 800,140 S1050,200 1200,150 L1200,280 L0,280 Z" fill="url(#wg3)"/>
  </svg>
  <svg class="wl wl2" viewBox="0 0 1200 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wg2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#c9993a" stop-opacity="0"/>
        <stop offset="25%"  stop-color="#f5c842" stop-opacity="1"/>
        <stop offset="60%"  stop-color="#f7d060" stop-opacity="1"/>
        <stop offset="100%" stop-color="#e8994a" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="M0,200 C100,150 200,240 350,180 S600,100 750,170 S1000,230 1200,170 L1200,280 L0,280 Z" fill="url(#wg2)"/>
  </svg>
  <svg class="wl wl1" viewBox="0 0 1200 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wg1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#f5c842" stop-opacity="0"/>
        <stop offset="20%"  stop-color="#f5c842" stop-opacity="1"/>
        <stop offset="50%"  stop-color="#fae090" stop-opacity="1"/>
        <stop offset="80%"  stop-color="#e8994a" stop-opacity="1"/>
        <stop offset="100%" stop-color="#f5c842" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="M0,220 C80,170 180,250 320,200 S550,120 700,190 S950,250 1200,195 L1200,280 L0,280 Z" fill="url(#wg1)"/>
  </svg>
  <div class="bloom"></div>
`
document.body.appendChild(wave)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
