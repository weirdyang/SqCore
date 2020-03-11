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
using YahooFinanceAPI;
using YahooFinanceAPI.Models;
using System.Diagnostics;

namespace SqCoreWeb
{
    class RtMktSummaryStock {
        public uint SecID { get; set; } = 0; // invalid value is best to be 0. If it is Uint32.MaxValue is the invalid, then problems if extending to Uint64
        public String Ticker { get; set; } = String.Empty;
        public double PreviousCloseIex { get; set; } = -100.0;     // obtained only once per day
        public double LastPriceIex { get; set; } = -100.0;     // real-time last price
        public List<double> AdjCloseHistory { get; set; } = new List<double>(); // Adjusted to dividend, splits (in theory)

        public List<HistoryPrice> SplitAdjHistory { get; set; } = new List<HistoryPrice>(); // from YF
    }

    class RtMktSummaryPrevClose     // this is sent usually just once per day
    {
        public uint SecID { get; set; } = 0;
        public String Ticker { get; set; } = String.Empty;
        public double PrevClose { get; set; } = -100.0;
        public double PrevCloseIex { get; set; } = -100.0;
    }

    class RtMktSummaryRtQuote
    {
        public uint SecID { get; set; } = 0;
        public String Ticker { get; set; } = String.Empty;
        public double Last { get; set; } = -100.0;     // real-time last price
    }

    class RtMktSummaryPeriodStat     // this is sent usually just once per day, OR when the PeriodStartDate changes at the client
    {
        public uint SecID { get; set; } = 0;
        public String Ticker { get; set; } = String.Empty;
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
            new RtMktSummaryStock() { Ticker = "QQQ"},
            new RtMktSummaryStock() { Ticker = "SPY"},
            new RtMktSummaryStock() { Ticker = "TLT"},
            new RtMktSummaryStock() { Ticker = "GLD"},
            new RtMktSummaryStock() { Ticker = "VXX"},
            new RtMktSummaryStock() { Ticker = "UNG"},
            new RtMktSummaryStock() { Ticker = "USO"}};
        static DateTime g_rtMktSummaryPreviousClosePrChecked = DateTime.MinValue; // UTC

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

            List<string> failedDownloads = new List<string>();
            DateTime now = DateTime.UtcNow;
            DateTime utcMorningCutoffTime = new DateTime(now.Year, now.Month, now.Day, 8, 0, 0);
            TimeSpan spanNowFromCutoff = now - utcMorningCutoffTime;
            TimeSpan spanCheckedFromCutoff = g_rtMktSummaryPreviousClosePrChecked - utcMorningCutoffTime;
            if (((now - g_rtMktSummaryPreviousClosePrChecked) > TimeSpan.FromHours(24)) || // either data is stale: older than 24h (if it was not run for a week)
                (spanNowFromCutoff > TimeSpan.Zero && spanCheckedFromCutoff < TimeSpan.Zero))
            {     // or if now is after 8:00, but checking was done before 8:00
                Utils.Logger.Info("OnConnectedAsync_MktHealth(): DownloadPreviousClose ");

                Stopwatch watch = Stopwatch.StartNew();
                DownloadPreviousCloseIex(g_mktSummaryStocks, failedDownloads);  // 500ms. These can run in parallel, but IEX is probably not needed
                Utils.Logger.ProfiledInfo("DownloadPreviousCloseIex", watch);
                DownloadHistoricalYF(g_mktSummaryStocks, failedDownloads);     // 1900ms
                Utils.Logger.ProfiledInfo("DownloadHistoricalYF", watch);    // both together takes 2265ms

                g_rtMktSummaryPreviousClosePrChecked = DateTime.UtcNow;
            }

            IEnumerable<RtMktSummaryPrevClose> rtMktSummaryToClient = g_mktSummaryStocks.Select(r =>
                {
                    double yfPreviousClose = r.SplitAdjHistory[^1].AdjClose;    // last item with C# 8.0, System.Index
                    var rtStock = new RtMktSummaryPrevClose()
                    {
                        SecID = r.SecID,
                        Ticker = r.Ticker,
                        PrevClose = yfPreviousClose,
                        PrevCloseIex = r.PreviousCloseIex
                    };
                    return rtStock;
                });

            Utils.Logger.Info("Clients.All.SendAsync: rtMktSummary_prevClose");
            DashboardPushHubKestrelBckgrndSrv.HubContext?.Clients.All.SendAsync("rtMktSummary_prevClose", rtMktSummaryToClient);
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

                Stopwatch watch = Stopwatch.StartNew();
                List<string> failedDownloads = new List<string>();
                DownloadLastPriceIex(g_mktSummaryStocks, failedDownloads);
                Utils.Logger.ProfiledInfo("DownloadLastPriceIex", watch);

                IEnumerable<RtMktSummaryRtQuote> rtMktSummaryToClient = g_mktSummaryStocks.Select(r =>
                {
                    var rtStock = new RtMktSummaryRtQuote()
                    {
                        SecID = r.SecID,
                        Ticker = r.Ticker,
                        Last = r.LastPriceIex,
                    };
                    return rtStock;
                });

                Utils.Logger.Info("Clients.All.SendAsync: rtMktSummary_rtQuote");
                DashboardPushHubKestrelBckgrndSrv.HubContext?.Clients.All.SendAsync("rtMktSummary_rtQuote", rtMktSummaryToClient);

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

        static void DownloadPreviousCloseIex(List<RtMktSummaryStock> p_stocks, /* DateOnly p_targetDate, */ List<string> p_failedDownloads) // takes 500ms
        {
            if (String.IsNullOrEmpty(Utils.Configuration["iexapisToken"])) {
                Utils.Logger.Error("The 'iexapisToken' key is missing from SensitiveData file.");
                return;
            }

            if (!Request_api_iextrading_com(string.Format("https://cloud.iexapis.com/stable/stock/market/batch?symbols={0}&types=quote&token={1}", String.Join(", ", p_stocks.Select(r => r.Ticker)), Utils.Configuration["iexapisToken"]), out HttpWebResponse? response) || (response == null))
                return;

            using (var reader = new System.IO.StreamReader(response.GetResponseStream(), ASCIIEncoding.ASCII))
            {
                string responseText = reader.ReadToEnd();
                Utils.Logger.Info("DownloadPreviousCloseIex() str = '{0}'", responseText);
                ExtractAttributeIex(responseText, "previousClose", p_stocks);
            }
            response.Close();
        }


// ***** Plan: Historical and RT quote data
// - the Website, once a day, gets historical price data from YF. Get all history.
// - during market-hours use IEX 'top', because it is free (and YF might ban our IP if we query too many times, IB has rate limit per minute, and VBroker need that bandwidth)
// - pre/postmarket, also use YF, but with very-very low frequency. Once per every 5 sec. (only if any user is connected). We don't need to use IB Markprice, because YF pre-market is very quickly available at 9:00, 5.5h before open.
// - code should know whether it is pre/postmarket hours, so we have to implement the same logic as in VBroker. (with the holiday days, and DB).
// - Call AfterMarket = PostMarket, because shorter and tradingview.com also calls "post-market" (YF calls: After hours)

// ***************************************************
// YF, IB, IEX preMarket, postMarket behaviour
// >UTC-7:50: YF:  no pre-market price. IB: there is no ask-bid, but there is an indicative value somehow, because Dashboard bar shows QQQ: 216.13 (+0.25%). I checked, that is the 'Mark price'. IB estimates that (probably for pre-market margin calls). YF and others will never have that, because it is sophisticated.
// >UTC-8:50: YF:  no pre-market price. IB: there is no ask-bid, but previously good indicative value went back to PreviousClose, so ChgPct = 0%, so in PreMarket that far away from Open, this MarkPrice is not very useful. IB did reset the price, because preparing for pre-market open in 10min.
// >UTC-9:10: YF (started at 9:00, there is premarket price: "Pre-Market: 4:03AM EST"), IB: There is Ask-bid spread. This is 5.5h before market open. That should be enough. So, I don't need IB indicative MarkPrice. IB AccInfo website is also good, showing QQQ change. IEX: IEX shows some false data, which is not yesterday close, but probably last day postMarket lastPrice sometime, which is not useful. So, in pre-market this IEX 'top' cannot be used. But maybe IEX cloud can be used in pre-market. Investigate.
// >UTC-0:50: (at night).

// ***************************************************
// IEX specific only
// https://github.com/iexg/IEX-API
// https://cloud.iexapis.com/stable/stock/market/batch?symbols=QQQ&types=quote&token=<...>  takes about 250ms, so it is quite fast.
// >08:20: "previousClose":215.37, !!! that is wrong. So IEX, next day at 8:20, it still gives back PreviousClose as 2 days ago. Wrong., ""latestPrice":216.48, "latestSource":"Close","latestUpdate":1582750800386," is the correct one, "iexRealtimePrice":216.44 is the 1 second earlier.
// >09:32: "previousClose":215.37  (still wrong), ""latestPrice":216.48, "latestSource":"Close","latestUpdate":1582750800386," is the correct one, "iexRealtimePrice":216.44 is the 1 second earlier.
// >10:12: "previousClose":215.37  (still wrong), "close":216.48,"closeTime":1582750800386  // That 'close' is correct, but previousClose is not.
// >11:22: "previousClose":215.37  (still wrong), "close":null,"closeTime":null   // 'close' is nulled
// >12:22: "previousClose":215.37  (still wrong), "close":null,"closeTime":null
// >14:15: "previousClose":215.37, "latestPrice":216.48,"latestSource":"Close",  (still wrong), just 15 minutes before market open, it is still wrong., "close":null,"closeTime":null
// >14:59: "previousClose":216.48, (finally correct) "close":null, "latestPrice":211.45,"latestSource":"IEX real time price","latestTime":"9:59:26 AM", so they fixed it only after the market opened at 14:30. It also reveals that they don't do Pre-market price, which is important for us.
// >21:50: "previousClose":216.48, "close":null,"closeTime":null, "latestPrice":205.82,"latestSource":"IEX price","latestTime":"3:59:56 PM",
// which is bad. The today Close price at 21:00 was 205.64, but it is not in the text anywhere. prevClose is 2 days ago, latestPrice is the 1 second early, not the ClosePrice.
// https://cloud.iexapis.com/stable/stock/market/batch?symbols=QQQ&types=chart&token=<...> 'chart': last 30 days data per day:
// https://cloud.iexapis.com/stable/stock/market/batch?symbols=QQQ&types=previous&token=<...>   'previous':
// https://github.com/iexg/IEX-API/issues/357
// This is available in /stock/quote https://iextrading.com/developer/docs/#quote
// extendedPrice, extendedChange, extendedChangePercent, extendedPriceTime
// These represent prices from 8am-9:30am and 4pm-5pm. We are aiming to cover the full pre/post market hours in a future version.
// https://github.com/iexg/IEX-API/issues/693
// >Use /stock/aapl/quote, this will return extended hours data (8AM - 5PM), "on Feb 26, 2019"
// "I have built a pretty solid scanner and research platform on IEX, but for live trading IEX is obviously not suitable (yet?). I hope one day IEX will provide truly real-time data. Otherwise, I am pretty happy with IEX so far. Been using it for 2 years now/"
// "We offer true real time IEX trades and quotes. IEX is the only exchange that provides free market data."
// >"// Paid account: $1 per 1 million messages/mo: 1000000/30/20/60 = 28 messages per minute." But maybe it is infinite. Just every 1M messages is $1. The next 1M messages is another $1. Etc. that is likely. Good. So, we don't have to throttle it, just be careful than only download data if it is needed.
// --------------------------------------------------------------
// ------------------ Problems of IEX:
// - pre/Postmarket only: 8am-9:30am and 4pm-5pm, when Yahoo has it from 9:00 UTC. So, it is not enough.
// - cut-off time is too late. Until 14:30 asking PreviousDay, it still gives the price 2 days ago. When YF will have premarket data at 9:00. Although "latestPrice" can be used as close.
// - the only good thing: in market-hours, RT prices are free, and very quick to obtain and batched.

        static void DownloadLastPriceIex(List<RtMktSummaryStock> p_stocks, List<string> p_failedDownloads)  // takes 450-540ms from WinPC
        {
            if (!Request_api_iextrading_com(string.Format("https://api.iextrading.com/1.0/tops?symbols={0}", String.Join(", ", p_stocks.Select(r => r.Ticker))), out HttpWebResponse? response) || (response == null))
                return;

            using (var reader = new System.IO.StreamReader(response.GetResponseStream(), ASCIIEncoding.ASCII))
            {
                string responseText = reader.ReadToEnd();
                Utils.Logger.Info("DownloadLastPriceIex() str = '{0}'", responseText);
                ExtractAttributeIex(responseText, "lastSalePrice", p_stocks);
            }
            response.Close();
        }

        private static void ExtractAttributeIex(string responseText, string p_attribute, List<RtMktSummaryStock> p_stocks)
        {
            int iStr = 0;   // this is the fastest. With IndexOf(). Not using RegEx, which is slow.
            while (iStr < responseText.Length)
            {
                int bSymbol = responseText.IndexOf("symbol\":\"", iStr);
                if (bSymbol == -1)
                    break;
                bSymbol += "symbol\":\"".Length;
                int eSymbol = responseText.IndexOf("\"", bSymbol);
                if (eSymbol == -1)
                    break;
                string ticker = responseText.Substring(bSymbol, eSymbol - bSymbol);
                int bAttribute = responseText.IndexOf(p_attribute + "\":", eSymbol);
                if (bAttribute == -1)
                    break;
                bAttribute += (p_attribute + "\":").Length;
                int eAttribute = responseText.IndexOf(",\"", bAttribute);
                if (eAttribute == -1)
                    break;
                string attributeStr = responseText.Substring(bAttribute, eAttribute - bAttribute);
                var stock = p_stocks.Find(r => r.Ticker == ticker);
                if (stock != null)
                {
                    Double.TryParse(attributeStr, out double attribute);
                    switch (p_attribute)
                    {
                        case "previousClose":
                            stock.PreviousCloseIex = attribute;
                            break;
                        case "lastSalePrice":
                            stock.LastPriceIex = attribute;
                            break;
                    }
                    
                }
                iStr = eAttribute;
            }
        }

        // compared to IB data stream, IEX is sometimes 5-10 sec late. But sometimes it is not totally accurate. It is like IB updates its price every second. IEX updates randomli. Sometimes it updates every 1 second, sometime after 10seconds. In general this is fine.
        // "We limit requests to 100 per second per IP measured in milliseconds, so no more than 1 request per 10 milliseconds."
        // https://iexcloud.io/pricing/ 
        // Free account: 50,000 core messages/mo, That is 50000/30/20/60 = 1.4 message per minute. 
        // Paid account: $1 per 1 million messages/mo: 1000000/30/20/60 = 28 messages per minute.
        // But maybe it is infinite. Just every 1M messages is $1. The next 1M messages is another $1. Etc. that is likely. Good. So, we don't have to throttle it, just be careful than only download data if it is needed.
        // At the moment 'tops' works without token, as https://api.iextrading.com/1.0/tops?symbols=QQQ,SPY,TLT,GLD,VXX,UNG,USO
        // but 'last' or other PreviousClose calls needs token: https://api.iextrading.com/1.0/lasts?symbols=QQQ,SPY,TLT,GLD,VXX,UNG,USO
        // Solution: query real-time lastPrice ever 2 seconds, but query PreviousClose only once a day.
        // This doesn't require token: https://api.iextrading.com/1.0/tops?symbols=AAPL,GOOGL
        // PreviousClose data requires token: https://cloud.iexapis.com/stable/stock/market/batch?symbols=AAPL,FB&types=quote&token=<get it from sensitive-data file>
        static bool Request_api_iextrading_com(string p_uri, out HttpWebResponse? response)
		{
			response = null;

            try
            {
                //HttpWebRequest request = (HttpWebRequest)WebRequest.Create(string.Format("https://api.iextrading.com/1.0/stock/market/batch?symbols={0}&types=quote", p_tickerString));
                //HttpWebRequest request = (HttpWebRequest)WebRequest.Create(string.Format("https://api.iextrading.com/1.0/last?symbols={0}", p_tickerString));       // WebExceptionStatus.ProtocolError: "Not Found"
                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(p_uri);
                request.KeepAlive = true;
				request.Headers.Set(HttpRequestHeader.CacheControl, "max-age=0");
				request.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36";
				request.Headers.Add("Upgrade-Insecure-Requests", @"1");
				request.Accept = "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8";
				request.Headers.Set(HttpRequestHeader.AcceptEncoding, "gzip, deflate, br");
				request.Headers.Set(HttpRequestHeader.AcceptLanguage, "hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7");
				//request.Headers.Set(HttpRequestHeader.Cookie, @"_ga=GA1.2.889468537.1517554268; ctoken=<...from SqFramework  source...>");    // it is probably an old token. Not useful. Not necessary.
				request.AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate;

                response = (HttpWebResponse)request.GetResponse();
            }
            catch (WebException e)
            {
                Utils.Logger.Error("Request_api_iextrading_com() WebException");
                if (e.Status == WebExceptionStatus.ProtocolError) 
                    response = (HttpWebResponse)e.Response;
                else 
                    return false;
            }
            catch (Exception)
            {
                Utils.Logger.Error("Request_api_iextrading_com() Exception");
                if (response != null) 
                    response.Close();
                return false;
            }
            return true;
        }


        static void DownloadHistoricalYF(List<RtMktSummaryStock> p_stocks, /* DateOnly p_targetDate, */ List<string> p_failedDownloads) // takes 1900ms
        {
            // 2. Obtain Token.Cookie and Crumb (maybe from cache until 12 hours) that is needed for Y!F API from 2017-05
            // after 2017-05: https://query1.finance.yahoo.com/v7/finance/download/VXX?period1=1492941064&period2=1495533064&interval=1d&events=history&crumb=VBSMphmA5gp
            // but we will accept standard dates too and convert to Unix epoch before sending it to YF
            // https://query1.finance.yahoo.com/v7/finance/download/VXX?period1=2017-02-31&period2=2017-05-23&interval=1d&events=history&crumb=VBSMphmA5gp
            // https://github.com/dennislwy/YahooFinanceAPI
            // first get a valid token from Yahoo Finance
            while (string.IsNullOrEmpty(Token.Cookie) || string.IsNullOrEmpty(Token.Crumb))
            {
                //await Token.RefreshAsync().ConfigureAwait(false);
                bool tokenSuccess = Token.RefreshAsync().ConfigureAwait(false).GetAwaiter().GetResult();
            }

            foreach (var stock in p_stocks)
            {
                // var hps = await Historical.GetPriceAsync(symbol, DateTime.Now.AddMonths(-1), DateTime.Now).ConfigureAwait(false);
                var hps = Historical.GetPriceAsync(stock.Ticker, new DateTime(2018, 02, 01, 0, 0, 0), DateTime.Now).ConfigureAwait(false);  // VXX history is from :Jan 25, 2018, so we can go back max 2 years
                stock.SplitAdjHistory = hps.GetAwaiter().GetResult();
            }
        }
    }
}