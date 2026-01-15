# Level2 - Order Flow Trading Dashboard

A professional-grade Order Flow trading system with real-time footprint charts, volume profile edge detection, and MT5 trade execution.

## Components

- **dashboard/** - React + TypeScript frontend with Canvas charts
- **orderflow_server.py** - Python FastAPI backend with WebSocket
- **TickFlow_Bridge.mq5** - MT5 Expert Advisor to send tick data

## Quick Start

### 1. Start Python Server
```bash
pip install fastapi uvicorn numpy xgboost
python orderflow_server.py
```
Server runs on http://localhost:8000

### 2. Start Dashboard
```bash
cd dashboard
npm install
npm run dev
```
Dashboard runs on http://localhost:3000

### 3. Attach MT5 EA
1. Copy `TickFlow_Bridge.mq5` to MT5 Experts folder
2. Compile in MetaEditor
3. Attach to XAUUSD chart
4. Enable WebRequest for `http://127.0.0.1:8000` in MT5 options

## Features

- **Live Footprint Charts** - Bid x Ask at each price level
- **Volume Profile Edge Detector** - Support/Resistance, POC, LVN, HVN
- **CVD** - Cumulative Volume Delta
- **Order Drag & Drop** - Modify SL/TP visually
- **Real-time WebSocket** - Low latency tick data
- **AI Brain** - XGBoost-based signal detection (not included, trained separately)

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Canvas API
- **Backend**: Python FastAPI, WebSocket
- **Trading**: MT5, MQL5

## AI Models (Not Included)

The AI models are too large for GitHub. Train your own or contact for pre-trained models:
- `pdratt_booster.json` - XGBoost Booster (44MB)
- `pdratt_of_brain_v1.json` - XGBoost Classifier (165MB)
