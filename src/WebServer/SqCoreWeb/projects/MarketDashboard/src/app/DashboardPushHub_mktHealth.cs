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

namespace SqCoreWeb
{
    class MktSummaryStock {
        public String Ticker { get; set; } = String.Empty;
        public double PreviousClose { get; set; } = -100.0;     // obtained only once per day
        public double LastPrice { get; set; } = -100.0;     // real-time last price
        // public double ChgPct { get; set; } = 0.01;       // sending PctChg is not necessary, if we send LastClose anyway. Clients may show tooltip of LastClose. It is in %, so 1% is sent as "1", not as "0.01" 
    }

    public partial class DashboardPushHub : Hub
    {
        static Timer m_mktSummaryTimer = new System.Threading.Timer(new TimerCallback(MktSummaryTimer_Elapsed), null, TimeSpan.FromMilliseconds(-1.0), TimeSpan.FromMilliseconds(-1.0));
        static bool m_mktSummaryTimerRunning = false;
        static object m_mktSummaryTimerLock = new Object();

        static int m_mktSummaryTimerFrequencyMs = 2000;    // as a demo go with 2sec, later change it to 5sec, do decrease server load.

        static List<MktSummaryStock> g_mktSummaryStocks = new List<MktSummaryStock>() {
            new MktSummaryStock() { Ticker = "QQQ"},
            new MktSummaryStock() { Ticker = "SPY"},
            new MktSummaryStock() { Ticker = "TLT"},
            new MktSummaryStock() { Ticker = "GLD"},
            new MktSummaryStock() { Ticker = "VXX"},
            new MktSummaryStock() { Ticker = "UNG"},
            new MktSummaryStock() { Ticker = "USO"}};
        static DateTime g_mktSummaryPreviousClosePrChecked = DateTime.MinValue; // UTC

        public void OnConnectedAsync_MktSummary()
        {
            lock (m_mktSummaryTimerLock)
            {
                if (!m_mktSummaryTimerRunning)
                {
                    m_mktSummaryTimer.Change(TimeSpan.FromMilliseconds(0), TimeSpan.FromMilliseconds(-1.0));    // runs only once. To avoid that it runs parallel, if first one doesn't finish
                    m_mktSummaryTimerRunning = true;
                }
            }
        }

        public void OnDisconnectedAsync_MktSummary(Exception exception)
        {
            if (g_clients.Count == 0)
            {
                lock (m_mktSummaryTimerLock)
                {
                    if (m_mktSummaryTimerRunning)
                    {
                        m_mktSummaryTimer.Change(TimeSpan.FromMilliseconds(-1.0), TimeSpan.FromMilliseconds(-1.0));    // runs only once. To avoid that it runs parallel, if first one doesn't finish
                        m_mktSummaryTimerRunning = false;
                    }
                }
            }
        }

        public static void MktSummaryTimer_Elapsed(object? state)    // Timer is coming on a ThreadPool thread
        {
            try
            {
                Utils.Logger.Info("MktSummaryTimer_Elapsed().");
                if (!m_mktSummaryTimerRunning)
                    return; // if it was disabled by another thread in the meantime, we should not waste resources to execute this.

                // Get data...
                List<string> failedDownloads = new List<string>();
                DateTime now = DateTime.UtcNow;
                DateTime utcMorningCutoffTime = new DateTime(now.Year, now.Month, now.Day, 8, 0, 0);
                TimeSpan spanNowFromCutoff = now - utcMorningCutoffTime;
                TimeSpan spanCheckedFromCutoff = g_mktSummaryPreviousClosePrChecked - utcMorningCutoffTime;
                if (((now - g_mktSummaryPreviousClosePrChecked) > TimeSpan.FromHours(24)) || // either data is stale: older than 24h (if it was not run for a week)
                    (spanNowFromCutoff > TimeSpan.Zero && spanCheckedFromCutoff < TimeSpan.Zero)) {     // or if now is after 8:00, but checking was done before 8:00
                    DownloadPreviousClose(g_mktSummaryStocks, failedDownloads);
                    g_mktSummaryPreviousClosePrChecked = DateTime.UtcNow;
                }

                DownloadLastPrice(g_mktSummaryStocks, failedDownloads);

                DashboardPushHubKestrelBckgrndSrv.HubContext?.Clients.All.SendAsync("mktSummaryUpdate", g_mktSummaryStocks);

                lock (m_mktSummaryTimerLock)
                {
                    if (m_mktSummaryTimerRunning)
                    {
                        m_mktSummaryTimer.Change(TimeSpan.FromMilliseconds(m_mktSummaryTimerFrequencyMs), TimeSpan.FromMilliseconds(-1.0));    // runs only once. To avoid that it runs parallel, if first one doesn't finish
                    }
                }
            }
            catch (Exception e)
            {
                Utils.Logger.Error(e, "MktSummaryTimer_Elapsed() exception.");
                throw;
            }
        }

        static void DownloadPreviousClose(List<MktSummaryStock> p_stocks, /* DateOnly p_targetDate, */ List<string> p_failedDownloads)
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
                ExtractAttribute(responseText, "previousClose", p_stocks);
            }
            response.Close();
        }

        static void DownloadLastPrice(List<MktSummaryStock> p_stocks, List<string> p_failedDownloads)
        {
            if (!Request_api_iextrading_com(string.Format("https://api.iextrading.com/1.0/tops?symbols={0}", String.Join(", ", p_stocks.Select(r => r.Ticker))), out HttpWebResponse? response) || (response == null))
                return;

            using (var reader = new System.IO.StreamReader(response.GetResponseStream(), ASCIIEncoding.ASCII))
            {
                string responseText = reader.ReadToEnd();
                ExtractAttribute(responseText, "lastSalePrice", p_stocks);
            }
            response.Close();
        }

        private static void ExtractAttribute(string responseText, string p_attribute, List<MktSummaryStock> p_stocks)
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
                            stock.PreviousClose = attribute;
                            break;
                        case "lastSalePrice":
                            stock.LastPrice = attribute;
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
        // This will not be enough for our real-time need even if we obtain the token. So, so there is no need for the token at the moment.
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
    }
}