// StockID itself doesn't identify a TimeSeries. A time series can be on AAPL, but one can be monthy, weekly, daily, 15min time series. Each belong to the same StockID.
// Learn how others implement the TimeSeries structure on GitHub.

// Do we have to store Date field? Probably yes, because some dates could be missing in the middle
// If Date is stored with ClosePrice, and then Date is stored with OpenPrice, High-LowPrice, it is better to factor out the Date field. 
// So, we have a big struct for each date. That is not exactly a fast Time-series I imagined.

// try to minimize memory footprint for fast backtests and that small memory footprint on Server. AWS RAM is expensive.

using System;
using System.Collections.Generic;

class TimeSeriesBase {
    public uint TimeSeriesBaseID { get; set; }  // unique identifier. Use the top 6 bits for Type
    public byte TypeOrTypeID { get; set; } // Stock, Futures, Options, CurrencyPair, Index (VIX), BrokerAccNAV, Custom (CPI)

    public string Ticker { get; set; } = String.Empty; // short for user visibility, stock ticker, "CPI_USA" for USA core inflation
    public string Name { get; set; } = String.Empty; // longer name: company name, "USA Consumer Price Index"
}

class Stock : TimeSeriesBase {
    public uint StockID { get; set; } // unique identifier. Use the top 6 bits for Type
}

class TimeSeries {
    public uint TimeSeriesID { get; set; }  // that is unique

    public TimeSeriesBase Base { get; set; } = new TimeSeriesBase();
    
    public List<object> Data { get; set; } = new List<object>();
}


class StockTimeSeries : TimeSeries 
{
    public uint StockID { get; set; }   // chop off top 6 bits of TimeSeriesID. There can be many StockTimeSeries belonging to the same StockID

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int Frequency { get; set; }  // monthy, weekly, daily, 15min time series

    public List<object> DailyPriceHistory { get; set; } = new List<object>(); // maybe eliminate this; and it should refer to the List<> in Base.Data 
}