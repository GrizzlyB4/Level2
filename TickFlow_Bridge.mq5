//+------------------------------------------------------------------+
//|                                              TickFlow_Bridge.mq5 |
//|                                  Copyright 2024, PDRatt Systems  |
//|                                             https://www.pdratt.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, PDRatt Systems"
#property link      "https://www.pdratt.com"
#property version   "2.00"
#property strict

#include &lt;Trade\Trade.mqh&gt;

//--- input parameters
input string   InpServerURL = "http://127.0.0.1:8000/ticks";           // Python Tick Server URL
input string   InpOrdersURL = "http://127.0.0.1:8000/pending_orders";  // Orders Endpoint URL
input string   InpLevelsURL = "http://127.0.0.1:8000/levels";          // Levels Endpoint URL
input string   InpPositionsURL = "http://127.0.0.1:8000/positions";   // Positions Endpoint URL
input int      InpSendIntervalMS = 100;                                // Sending interval in milliseconds
input int      InpMaxBufferSize = 500;                                 // Max ticks before forced send
input double   InpDefaultLotSize = 0.10;                               // Default lot size
input int      InpMagicNumber = 123456;                                // Magic number for orders

//--- global variables
string g_Symbol;
int g_Digits;
long g_LastTickTimestamp = 0;
string g_TickBuffer = "";
int g_TicksCount = 0;
CTrade g_Trade;
int g_OrderPollCounter = 0;
int g_LevelsCounter = 0;

int OnInit()
{
   g_Symbol = _Symbol;
   g_Digits = (int)SymbolInfoInteger(g_Symbol, SYMBOL_DIGITS);
   g_Trade.SetExpertMagicNumber(InpMagicNumber);
   g_Trade.SetDeviationInPoints(50);
   g_Trade.SetTypeFilling(ORDER_FILLING_IOC);
   EventSetMillisecondTimer(InpSendIntervalMS);
   Print("TickFlow Bridge v2 Initialized for ", g_Symbol, " with Order Execution &amp; Levels");
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("TickFlow Bridge Stopped.");
}

void OnTick()
{
   MqlTick last_tick;
   if(SymbolInfoTick(g_Symbol, last_tick))
   {
      string tickJson = StringFormat("{\"t\":%I64d,\"b\":%.*f,\"a\":%.*f,\"l\":%.*f,\"v\":%I64u,\"f\":%u}",
         last_tick.time_msc, g_Digits, last_tick.bid, g_Digits, last_tick.ask,
         g_Digits, last_tick.last, last_tick.volume, last_tick.flags);
      if(g_TickBuffer != "") g_TickBuffer += ",";
      g_TickBuffer += tickJson;
      g_TicksCount++;
      if(g_TicksCount >= InpMaxBufferSize) SendTickData();
   }
}

void OnTimer()
{
   if(g_TicksCount > 0) SendTickData();
   PollPendingOrders();
   ManageTrailingStop();
   SendPositions();
   g_LevelsCounter++;
   if(g_LevelsCounter >= 100) { g_LevelsCounter = 0; SendLevels(); }
}

void SendTickData()
{
   string fullJson = "{\"symbol\":\"" + g_Symbol + "\",\"ticks\":[" + g_TickBuffer + "]}";
   char data[];
   ArrayResize(data, StringToCharArray(fullJson, data, 0, WHOLE_ARRAY, CP_UTF8)-1);
   string headers = "Content-Type: application/json\r\n";
   char result[];
   string result_headers;
   int res = WebRequest("POST", InpServerURL, headers, 1000, data, result, result_headers);
   if(res == 200 || res == 204) { g_TickBuffer = ""; g_TicksCount = 0; }
   else if(res == -1) { Print("WebRequest Error: Check if URL is allowed"); }
   else { g_TickBuffer = ""; g_TicksCount = 0; }
}

void PollPendingOrders()
{
   char data[], result[];
   string result_headers;
   int res = WebRequest("GET", InpOrdersURL, "", 1000, data, result, result_headers);
   if(res == 200)
   {
      string response = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
      if(StringFind(response, "\"orders\":[]") >= 0) return;
      int ordersStart = StringFind(response, "\"orders\":[");
      if(ordersStart < 0) return;
      ordersStart += 10;
      int ordersEnd = StringFind(response, "]", ordersStart);
      if(ordersEnd < 0) return;
      string ordersArray = StringSubstr(response, ordersStart, ordersEnd - ordersStart);
      int pos = 0;
      while(pos < StringLen(ordersArray))
      {
         int objStart = StringFind(ordersArray, "{", pos);
         if(objStart < 0) break;
         int objEnd = StringFind(ordersArray, "}", objStart);
         if(objEnd < 0) break;
         string orderJson = StringSubstr(ordersArray, objStart, objEnd - objStart + 1);
         string action = ExtractJsonString(orderJson, "action");
         double lots = ExtractJsonDouble(orderJson, "lots");
         double sl = ExtractJsonDouble(orderJson, "sl");
         double tp = ExtractJsonDouble(orderJson, "tp");
         double ts = ExtractJsonDouble(orderJson, "ts");
         if(action == "MODIFY")
         {
            ulong ticket = (ulong)ExtractJsonDouble(orderJson, "ticket");
            string modType = ExtractJsonString(orderJson, "modify_type");
            double price = ExtractJsonDouble(orderJson, "price");
            ModifyPosition(ticket, modType, price);
         }
         else if(action == "CLOSE")
         {
            ulong ticket = (ulong)ExtractJsonDouble(orderJson, "ticket");
            if(ticket > 0 &amp;&amp; PositionSelectByTicket(ticket)) g_Trade.PositionClose(ticket);
         }
         else
         {
            if(lots <= 0) lots = InpDefaultLotSize;
            ExecuteOrder(action, lots, sl, tp, ts);
         }
         pos = objEnd + 1;
      }
   }
}

string ExtractJsonString(string json, string key)
{
   string searchKey = "\"" + key + "\":\"";
   int start = StringFind(json, searchKey);
   if(start < 0) return "";
   start += StringLen(searchKey);
   int end = StringFind(json, "\"", start);
   if(end < 0) return "";
   return StringSubstr(json, start, end - start);
}

double ExtractJsonDouble(string json, string key)
{
   string searchKey = "\"" + key + "\":";
   int start = StringFind(json, searchKey);
   if(start < 0) return 0.0;
   start += StringLen(searchKey);
   int end = StringFind(json, ",", start);
   int end2 = StringFind(json, "}", start);
   if(end < 0) end = end2;
   else if(end2 >= 0 &amp;&amp; end2 < end) end = end2;
   if(end < 0) return 0.0;
   return StringToDouble(StringSubstr(json, start, end - start));
}

void ExecuteOrder(string action, double lots, double sl_pts, double tp_pts, double ts_pts)
{
   double sl_price = 0, tp_price = 0;
   string comment = "OF_Order";
   if(ts_pts > 0) comment = StringFormat("TS:%d", (int)ts_pts);
   if(action == "BUY" || action == "buy")
   {
      double ask = SymbolInfoDouble(g_Symbol, SYMBOL_ASK);
      if(sl_pts > 0) sl_price = ask - sl_pts * _Point;
      if(tp_pts > 0) tp_price = ask + tp_pts * _Point;
      g_Trade.Buy(lots, g_Symbol, ask, sl_price, tp_price, comment);
   }
   else if(action == "SELL" || action == "sell")
   {
      double bid = SymbolInfoDouble(g_Symbol, SYMBOL_BID);
      if(sl_pts > 0) sl_price = bid + sl_pts * _Point;
      if(tp_pts > 0) tp_price = bid - tp_pts * _Point;
      g_Trade.Sell(lots, g_Symbol, bid, sl_price, tp_price, comment);
   }
   else if(action == "CLOSE_ALL" || action == "close_all")
   {
      for(int i = PositionsTotal() - 1; i >= 0; i--)
      {
         ulong ticket = PositionGetTicket(i);
         if(PositionSelectByTicket(ticket) &amp;&amp; PositionGetString(POSITION_SYMBOL) == g_Symbol)
            g_Trade.PositionClose(ticket);
      }
   }
}

void ManageTrailingStop()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL) != g_Symbol) continue;
      string comment = PositionGetString(POSITION_COMMENT);
      if(StringFind(comment, "TS:") < 0) continue;
      int ts_idx = StringFind(comment, "TS:");
      int ts_pts = (int)StringToInteger(StringSubstr(comment, ts_idx + 3));
      if(ts_pts <= 0) continue;
      double ask = SymbolInfoDouble(g_Symbol, SYMBOL_ASK);
      double bid = SymbolInfoDouble(g_Symbol, SYMBOL_BID);
      double sl = PositionGetDouble(POSITION_SL);
      double entry = PositionGetDouble(POSITION_PRICE_OPEN);
      long type = PositionGetInteger(POSITION_TYPE);
      if(type == POSITION_TYPE_BUY)
      {
         double new_sl = bid - ts_pts * _Point;
         if(new_sl > sl &amp;&amp; bid > entry) g_Trade.PositionModify(ticket, new_sl, PositionGetDouble(POSITION_TP));
      }
      else if(type == POSITION_TYPE_SELL)
      {
         double new_sl = ask + ts_pts * _Point;
         if((new_sl < sl || sl == 0) &amp;&amp; ask < entry) g_Trade.PositionModify(ticket, new_sl, PositionGetDouble(POSITION_TP));
      }
   }
}

void ModifyPosition(ulong ticket, string type, double price)
{
   if(PositionSelectByTicket(ticket))
   {
      double sl = PositionGetDouble(POSITION_SL);
      double tp = PositionGetDouble(POSITION_TP);
      if(type == "SL") sl = price;
      if(type == "TP") tp = price;
      g_Trade.PositionModify(ticket, sl, tp);
   }
}

void SendLevels()
{
   double pdh = iHigh(g_Symbol, PERIOD_D1, 1);
   double pdl = iLow(g_Symbol, PERIOD_D1, 1);
   double open = iOpen(g_Symbol, PERIOD_D1, 0);
   double range = pdh - pdl;
   double pdr25 = pdl + range * 0.25;
   double pdr50 = pdl + range * 0.50;
   double pdr75 = pdl + range * 0.75;
   string json = StringFormat("{\"symbol\":\"%s\",\"pdh\":%.*f,\"pdl\":%.*f,\"pdr25\":%.*f,\"pdr50\":%.*f,\"pdr75\":%.*f,\"open\":%.*f}",
      g_Symbol, g_Digits, pdh, g_Digits, pdl, g_Digits, pdr25, g_Digits, pdr50, g_Digits, pdr75, g_Digits, open);
   char data[];
   ArrayResize(data, StringToCharArray(json, data, 0, WHOLE_ARRAY, CP_UTF8)-1);
   string headers = "Content-Type: application/json\r\n";
   char result[];
   string result_headers;
   WebRequest("POST", InpLevelsURL, headers, 1000, data, result, result_headers);
}

void SendPositions()
{
   string json = "[";
   bool first = true;
   for(int i = 0; i < PositionsTotal(); i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL) != g_Symbol) continue;
      if(!first) json += ",";
      json += StringFormat("{\"ticket\":%I64u,\"symbol\":\"%s\",\"type\":\"%s\",\"lots\":%.2f,\"entry\":%.*f,\"sl\":%.*f,\"tp\":%.*f,\"profit\":%.2f}",
         ticket, PositionGetString(POSITION_SYMBOL),
         (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? "BUY" : "SELL"),
         PositionGetDouble(POSITION_VOLUME), g_Digits, PositionGetDouble(POSITION_PRICE_OPEN),
         g_Digits, PositionGetDouble(POSITION_SL), g_Digits, PositionGetDouble(POSITION_TP),
         PositionGetDouble(POSITION_PROFIT));
      first = false;
   }
   json += "]";
   char data[];
   ArrayResize(data, StringToCharArray(json, data, 0, WHOLE_ARRAY, CP_UTF8)-1);
   string headers = "Content-Type: application/json\r\n";
   char result[];
   string result_headers;
   WebRequest("POST", InpPositionsURL, headers, 500, data, result, result_headers);
}
