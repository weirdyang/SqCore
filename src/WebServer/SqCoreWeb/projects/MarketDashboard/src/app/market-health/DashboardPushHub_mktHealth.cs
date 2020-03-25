using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading;
using System.Threading.Tasks;
using SqCommon;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.Hosting;
using System.Text;
using System.Net;
using System.Diagnostics;
using FinTechCommon;

namespace SqCoreWeb
{
    class RtMktSummaryStock
    {
        public uint SecID { get; set; } = 0; // invalid value is best to be 0. If it is Uint32.MaxValue is the invalid, then problems if extending to Uint64
        public String Ticker { get; set; } = String.Empty;
    }

    class RtMktSumRtStat   // struct sent to browser clients every 2-4 seconds
    {
        public uint SecID { get; set; } = 0;
        public double Last { get; set; } = -100.0;     // real-time last price
    }

    class RtMktSumNonRtStat     // this is sent to clients usually just once per day, OR when the PeriodStartDate changes at the client
    {
        public uint SecID { get; set; } = 0;        // set the Client know what is the SecID, because RtStat will not send it.
        public String Ticker { get; set; } = String.Empty;

        // when previousClose gradually changes (if user left browser open for a week), PeriodHigh, PeriodLow should be sent again (maybe we are at market high or low)
        // sometimes, the user changed Period from YTD to 2y. It is a choice, we will resend him the PreviousClose data again. Although it is not necessary. That way we only one class, not 2.
        public double PreviousClose { get; set; } = -100.0;
        public DateTime PeriodStart { get; set; } = DateTime.MinValue;
        public double PeriodOpen { get; set; } = -100.0;
        public double PeriodHigh { get; set; } = -100.0;
        public double PeriodLow { get; set; } = -100.0;
    }


    // The knowledge 'WHEN to send what' should be programmed on the server. When server senses that there is an update, then it broadcast to clients. 
    // Do not implement the 'intelligence' of WHEN to change data on the client. It can be too complicated, like knowing if there was a holiday, a half-trading day, etc. 
    // Clients should be slim programmed. They should only care, that IF they receive a new data, then Refresh.
    public partial class DashboardPushHub : Hub
    {
        static Timer m_rtMktSummaryTimer = new System.Threading.Timer(new TimerCallback(RtMktSummaryTimer_Elapsed), null, TimeSpan.FromMilliseconds(-1.0), TimeSpan.FromMilliseconds(-1.0));
        static bool m_rtMktSummaryTimerRunning = false;
        static object m_rtMktSummaryTimerLock = new Object();

        static int m_rtMktSummaryTimerFrequencyMs = 3000;    // as a demo go with 3sec, later change it to 5sec, do decrease server load.

        static List<RtMktSummaryStock> g_mktSummaryStocks = new List<RtMktSummaryStock>() {
            new RtMktSummaryStock() { Ticker = "GLD"},  // alphabetical order for faster search
            new RtMktSummaryStock() { Ticker = "QQQ"},
            new RtMktSummaryStock() { Ticker = "SPY"},
            new RtMktSummaryStock() { Ticker = "TLT"},
            new RtMktSummaryStock() { Ticker = "VXX"},
            new RtMktSummaryStock() { Ticker = "UNG"},
            new RtMktSummaryStock() { Ticker = "USO"}};
        static DateTime g_rtMktSummaryPreviousClosePrChecked = DateTime.MinValue; // UTC

        static void EvMemDbInitialized_mktHealth()
        {
            // fill up SecID based on Tickers. For faster access later.
            foreach (var stock in g_mktSummaryStocks)
            {
                Security sec = MemDb.gMemDb.GetFirstMatchingSecurity(stock.Ticker);
                stock.SecID = sec.SecID;
            }
        }

        public void OnConnectedAsync_MktHealth()
        {
            lock (m_rtMktSummaryTimerLock)
            {
                if (!m_rtMktSummaryTimerRunning)
                {
                    Utils.Logger.Info("OnConnectedAsync_MktHealth(). Starting m_rtMktSummaryTimer.");
                    m_rtMktSummaryTimer.Change(TimeSpan.FromMilliseconds(0), TimeSpan.FromMilliseconds(-1.0));    // runs only once. To avoid that it runs parallel, if first one doesn't finish
                    m_rtMktSummaryTimerRunning = true;
                }
            }

            DateTime todayET = Utils.ConvertTimeFromUtcToEt(DateTime.UtcNow).Date;
            DateTime periodStart = new DateTime(todayET.Year - 1, 12, 31);  // YTD relative to 31st December, last year

            IEnumerable<RtMktSumNonRtStat> periodStatToClient = g_mktSummaryStocks.Select(r =>
            {
                Security sec = MemDb.gMemDb.GetFirstMatchingSecurity(r.Ticker);
                DateOnly[] dates = sec.DailyHistory.GetKeyArrayDirect();
                float[] sdaCloses = sec.DailyHistory.GetValue1ArrayDirect(TickType.SplitDivAdjClose);

                // At 16:00, or even intraday: YF gives even the today last-realtime price with a today-date. We have to find any date backwards, which is NOT today. That is the PreviousClose.
                int iPrevDay = (dates[dates.Length - 1] >= new DateOnly(Utils.ConvertTimeFromUtcToEt(DateTime.UtcNow))) ? dates.Length - 2 : dates.Length - 1;
                Debug.WriteLine($"Found: {r.Ticker}, {dates[iPrevDay]}:{sdaCloses[iPrevDay]}");

                int iPeriodStartOrBefore = sec.DailyHistory.IndexOfKey(new DateOnly(periodStart));      // the valid price at the weekend is the one on the previous Friday.
                float max = float.MinValue, min = float.MaxValue;
                for (int i = iPeriodStartOrBefore; i <= iPrevDay; i++)
                {
                    if (sdaCloses[i] > max)
                        max = sdaCloses[i];
                    if (sdaCloses[i] < min)
                        min = sdaCloses[i];
                }

                var rtStock = new RtMktSumNonRtStat()
                {
                    SecID = r.SecID,
                    Ticker = r.Ticker,
                    PreviousClose = sdaCloses[iPrevDay],
                    PeriodStart = periodStart,
                    PeriodOpen = sdaCloses[iPeriodStartOrBefore],
                    PeriodHigh = max,
                    PeriodLow = min
                };
                return rtStock;
            });

            Utils.Logger.Info("Clients.All.SendAsync: RtMktSumNonRtStat");
            DashboardPushHubKestrelBckgrndSrv.HubContext?.Clients.All.SendAsync("RtMktSumNonRtStat", periodStatToClient);
        }

        public void OnDisconnectedAsync_MktHealth(Exception exception)
        {
            if (g_clients.Count == 0)
            {
                lock (m_rtMktSummaryTimerLock)
                {
                    if (m_rtMktSummaryTimerRunning)
                    {
                        m_rtMktSummaryTimer.Change(TimeSpan.FromMilliseconds(-1.0), TimeSpan.FromMilliseconds(-1.0));    // runs only once. To avoid that it runs parallel, if first one doesn't finish
                        m_rtMktSummaryTimerRunning = false;
                    }
                }
            }
        }

        public static void RtMktSummaryTimer_Elapsed(object? state)    // Timer is coming on a ThreadPool thread
        {
            try
            {
                Utils.Logger.Info("RtMktSummaryTimer_Elapsed(). BEGIN");
                if (!m_rtMktSummaryTimerRunning)
                    return; // if it was disabled by another thread in the meantime, we should not waste resources to execute this.

                List<string> failedDownloads = new List<string>();
                var lastPrices = MemDb.gMemDb.GetLastRtPrice(g_mktSummaryStocks.Select(r => r.SecID).ToArray());

                IEnumerable<RtMktSumRtStat> rtMktSummaryToClient = lastPrices.Select(r =>
                {
                    var rtStock = new RtMktSumRtStat()
                    {
                        SecID = r.SecdID,
                        Last = r.LastPrice,
                    };
                    return rtStock;
                });

                Utils.Logger.Info("Clients.All.SendAsync: RtMktSumRtStat");
                DashboardPushHubKestrelBckgrndSrv.HubContext?.Clients.All.SendAsync("RtMktSumRtStat", rtMktSummaryToClient);

                lock (m_rtMktSummaryTimerLock)
                {
                    if (m_rtMktSummaryTimerRunning)
                    {
                        m_rtMktSummaryTimer.Change(TimeSpan.FromMilliseconds(m_rtMktSummaryTimerFrequencyMs), TimeSpan.FromMilliseconds(-1.0));    // runs only once. To avoid that it runs parallel, if first one doesn't finish
                    }
                }
                Utils.Logger.Info("RtMktSummaryTimer_Elapsed(). END");
            }
            catch (Exception e)
            {
                Utils.Logger.Error(e, "RtMktSummaryTimer_Elapsed() exception.");
                throw;
            }
        }

    }
}