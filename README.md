# AlgoTradingAtt - Order Flow Trading Dashboard

A professional-grade Order Flow trading dashboard with real-time footprint charts, volume profile edge detection, and trade execution.

## Features

- **Live Footprint Charts**: Bid x Ask visualization at each price level
- **Volume Profile Edge Detector**: Identifies support/resistance zones, POC, LVN, HVN
- **CVD (Cumulative Volume Delta)**: Track buying vs selling pressure
- **Order Drag & Drop**: Visually modify SL/TP by dragging
- **WebSocket Integration**: Real-time data from MT5 via Python bridge
- **Dark Cyber-Grid Theme**: Professional trading interface

## Tech Stack

- React + TypeScript + Vite
- Canvas-based charting
- WebSocket for real-time data
- Python FastAPI backend

## Quick Start

```bash
cd WebDashboard/static/nexus-trading-level-2-dashboard
npm install
npm run dev
```

Start Python server:
```bash
cd WebDashboard
python orderflow_server.py
```

## License

Private - All rights reserved
