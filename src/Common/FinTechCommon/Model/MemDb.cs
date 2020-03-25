using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using SqCommon;
using YahooFinanceApi;

namespace FinTechCommon
{

    [DebuggerDisplay("Ticker = {Ticker}")]
    public class Security
    {
        public uint SecID { get; set; } = 0; // invalid value is best to be 0. If it is Uint32.MaxValue is the invalid, then problems if extending to Uint64
        public String Ticker { get; set; } = String.Empty;

        public String ExpectedHistorySpan { get; set; } = String.Empty;
        public FinTimeSeries<DateOnly, float, uint> DailyHistory { get; set; } = new FinTimeSeries<DateOnly, float, uint>();

        public float LastPriceIex { get; set; } = -100.0f;     // real-time last price
    }

    public partial class MemDb
    {

        public static MemDb gMemDb = new MemDb();
        public List<Security> Securities { get; } = new List<Security>() { // to minimize mem footprint, only load the necessary dates (not all history). 1Year = 2KB
            new Security() { SecID = 1, Ticker = "GLD"},    // alphabetical order for faster search
            new Security() { SecID = 2, Ticker = "QQQ", ExpectedHistorySpan="Date: 2010-01-01"},
            new Security() { SecID = 3, Ticker = "SPY"},
            new Security() { SecID = 4, Ticker = "TLT"},
            new Security() { SecID = 5, Ticker = "VXX"},
            new Security() { SecID = 6, Ticker = "UNG", ExpectedHistorySpan="5y"},
            new Security() { SecID = 7, Ticker = "USO", ExpectedHistorySpan="5y"}};


        Timer m_reloadHistoricalDataTimer;
        DateTime m_lastReloadHistoricalData = DateTime.MinValue; // UTC

        public delegate void InitializedEventHandler();
        public event InitializedEventHandler? EvInitialized = null;

        public MemDb()
        {
            m_reloadHistoricalDataTimer = new System.Threading.Timer(new TimerCallback(ReloadHistoricalDataTimer_Elapsed), this, TimeSpan.FromMilliseconds(-1.0), TimeSpan.FromMilliseconds(-1.0));
        }

        public void Init()
        {
            ThreadPool.QueueUserWorkItem(Init_WT);
        }

        void Init_WT(object p_state)    // WT : WorkThread
        {
            Thread.CurrentThread.Name = "MemDb.Init_WT Thread";

            ReloadHistoricalDataAndSetTimer();

            EvInitialized?.Invoke();
        }

        public Security GetSecurity(uint p_secID)
        {
            // TODO: if fast access is important order Securities by SecID as well, and then use BinarySearch
            foreach (var sec in Securities)
            {
                if (sec.SecID == p_secID)
                    return sec;
            }
            throw new Exception($"SecID '{p_secID}' is missing from MemDb.Securities.");
        }

        public Security GetFirstMatchingSecurity(string p_ticker)
        {
            // although Tickers are not unique (only SecID), most of the time clients access it by Ticker.
            //  TODO: if fast access is important order Securities by Ticker, and then use BinarySearch
            foreach (var sec in Securities)
            {
                if (sec.Ticker == p_ticker)
                    return sec;
            }
            throw new Exception($"Ticker '{p_ticker}' is missing from MemDb.Securities.");
        }

        public Security[] GetAllMatchingSecurities(string p_ticker)
        {
            throw new NotImplementedException();
        }

        public static void ReloadHistoricalDataTimer_Elapsed(object state)    // Timer is coming on a ThreadPool thread
        {
            ((MemDb)state).ReloadHistoricalDataAndSetTimer();
        }

        // https://github.com/lppkarl/YahooFinanceApi
        void ReloadHistoricalDataAndSetTimer()
        {
            try
            {
                // The startTime & endTime here defaults to EST timezone

                // YF sends this weird Texts, which are converted to Decimals, so we don't lose TEXT conversion info.
                // AAPL:    DateTime: 2016-01-04 00:00:00, Open: 102.610001, High: 105.370003, Low: 102.000000, Close: 105.349998, Volume: 67649400, AdjustedClose: 98.213585  (original)
                //          DateTime: 2016-01-04 00:00:00, Open: 102.61, High: 105.37, Low: 102, Close: 105.35, Volume: 67649400, AdjustedClose: 98.2136
                // we have to round values of 102.610001 to 2 decimals (in normal stocks), but some stocks price is 0.00452, then that should be left without conversion.
                // AdjustedClose 98.213585 is exactly how YF sends it, which is correct. Just in YF HTML UI, it is converted to 98.21. However, for calculations, we may need better precision.
                // In general, round these price data Decimals to 4 decimal precision.
                foreach (var sec in Securities)
                {
                    var history = Yahoo.GetHistoricalAsync(sec.Ticker, new DateTime(2018, 02, 01, 0, 0, 0), DateTime.Now, Period.Daily).Result;

                    // for penny stocks, IB and YF considers them for max. 4 digits. UWT price (both in IB ask-bid, YF history) 2020-03-19: 0.3160, 2020-03-23: 2302
                    // sec.AdjCloseHistory = history.Select(r => (double)Math.Round(r.AdjustedClose, 4)).ToList();

                    var dates = history.Select(r => new DateOnly(r.DateTime)).ToArray();
                    var kvpar1 = new KeyValuePair<TickType, float[]>(TickType.SplitDivAdjClose, history.Select(r => (float)Math.Round(r.AdjustedClose, 4)).ToArray());
                    sec.DailyHistory = new FinTimeSeries<DateOnly, float, uint>(
                        dates,
                        new KeyValuePair<TickType, float[]>[] { kvpar1 },
                        new KeyValuePair<TickType, uint[]>[] { }
                    );

                    var tsDates = sec.DailyHistory.Keys;
                    var tsValues = sec.DailyHistory.Values1(TickType.SplitDivAdjClose);
                    Debug.WriteLine($"{sec.Ticker} last: DateTime: {tsDates.Last()}, Close: {tsValues.Last()}");  // only writes to Console in Debug mode in vscode 'Debug Console'
                }

                m_lastReloadHistoricalData = DateTime.UtcNow;
            }
            catch (System.Exception e)
            {
                Utils.Logger.Error(e, "ReloadHistoricalDataAndSetTimer()");
            }


            // reload times should be relative to ET (Eastern Time), because that is how USA stock exchanges work.
            // Reload History approx in UTC: at 9:00 (when IB resets its own timers and pre-market starts)(in the 3 weeks when summer-winter DST difference, it is 8:00), at 14:00 (30min before market open, last time to get correct data, because sometimes YF fixes data late), 21:30 (30min after close)
            // In ET time zone, these are:  4:00ET, 9:00ET, 16:30ET. IB starts premarket trading at 4:00. YF starts to have premarket data from 4:00ET.
            DateTime etNow = Utils.ConvertTimeFromUtcToEt(DateTime.UtcNow);
            int nowTimeOnlySec = etNow.Hour * 60 * 60 + etNow.Minute * 60 + etNow.Second;
            int targetTimeOnlySec;
            if (nowTimeOnlySec < 4 * 60 * 60)
                targetTimeOnlySec = 4 * 60 * 60;
            else if (nowTimeOnlySec < 9 * 60 * 60)
                targetTimeOnlySec = 9 * 60 * 60;
            else if (nowTimeOnlySec < 16 * 60 * 60 + 30 * 60)
                targetTimeOnlySec = 16 * 60 * 60 + 30 * 60;
            else
                targetTimeOnlySec = 24 * 60 * 60 + 4 * 60 * 60; // next day 4:00

            DateTime targetDateEt = etNow.Date.AddSeconds(targetTimeOnlySec);
            Utils.Logger.Info($"m_reloadHistoricalDataTimer set next targetdate: {targetDateEt.ToSqDateTimeStr()} ET");
            m_reloadHistoricalDataTimer.Change(targetDateEt - etNow, TimeSpan.FromMilliseconds(-1.0));     // runs only once.
        }

        public void Exit()
        {
        }

    }

}