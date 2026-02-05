import React from 'react';

export const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    
    :root {
      --gold-primary: #3b82f6; /* Changed to Blue 500 for Technology theme */
      --gold-dark: #1d4ed8; 
      --bg-dark: #050505;
    }

    body {
      font-family: 'Inter', sans-serif;
      /* Background handled by .mesh-bg in index.css */
      /* No static images or gradients here to avoid conflict */
      background-color: transparent; 
      color: #fff;
    }
    
    .font-serif { font-family: 'Playfair Display', serif; }
    
    /* Utility for refined scrollbars */
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #09090b; 
    }
    ::-webkit-scrollbar-thumb {
      background: #333; 
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #444; 
    }
  `}</style>
);
