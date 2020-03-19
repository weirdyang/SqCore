using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Net;
using System.ServiceModel.Syndication;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows;
using System.Xml.Linq;
using SqCommon;

namespace SqCoreWeb
{
    public enum NewsSource
    {
        YahooRSS,
        CnbcRss,
        Benzinga
    }
    public class NewsItem
    {
        public string Ticker { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string LinkUrl { get; set; } = string.Empty;
        public DateTime DownloadTime { get; set; }
        public DateTime PublishDate { get; set; }
        public string Source { get; set; } = string.Empty;
    }

    public class QuickfolioNewsDownloader
    {
        Dictionary<int, List<NewsItem>> m_newsMemory = new Dictionary<int, List<NewsItem>>();
        Random m_random = new Random(DateTime.Now.Millisecond);
        KeyValuePair<int, int> m_sleepBetweenDnsMs = new KeyValuePair<int, int>(2000, 1000);     // <fix, random>
        string[] m_stockTickers = { "AAPL", "ADBE", "AMZN", "BABA", "CRM", "FB", "GOOGL", "MA", "MSFT", "NVDA", "PYPL", "QCOM", "V" };

        public QuickfolioNewsDownloader()
        {
            string valuesFromGSheetStr = "Error. Make sure GoogleApiKeyKey, GoogleApiKeyKey is in SQLab.WebServer.SQLab.NoGitHub.json !";
            if (!String.IsNullOrEmpty(Utils.Configuration["Google:GoogleApiKeyName"]) && !String.IsNullOrEmpty(Utils.Configuration["Google:GoogleApiKeyKey"]))
            {
                if (!Utils.DownloadStringWithRetry(out valuesFromGSheetStr, "https://sheets.googleapis.com/v4/spreadsheets/1c5ER22sXDEVzW3uKthclpArlZvYuZd6xUffXhs6rRsM/values/A1%3AA1?key=" + Utils.Configuration["Google:GoogleApiKeyKey"]))
                    valuesFromGSheetStr = "Error in DownloadStringWithRetry().";
            }
            if (!valuesFromGSheetStr.StartsWith("Error"))
            {
                ExtractTickers(valuesFromGSheetStr);
            }
        }

        private void ExtractTickers(string p_spreadsheetString)
        {
            int pos = p_spreadsheetString.IndexOf(@"""values"":");
            if (pos < 0)
                return;
            p_spreadsheetString = p_spreadsheetString.Substring(pos + 9); // cut off until the end of "values":
            int posStart = p_spreadsheetString.IndexOf(@"""");
            if (posStart < 0)
                return;
            int posEnd = p_spreadsheetString.IndexOf(@"""", posStart + 1);
            if (posEnd < 0)
                return;
            string cellValue = p_spreadsheetString.Substring(posStart + 1, posEnd - posStart - 1);
            m_stockTickers = cellValue.Split(',').Select(x => x.Trim()).ToArray();
        }

        internal List<NewsItem> GetCommonNews()
        {
            string rssFeedUrl = string.Format(@"https://www.cnbc.com/id/100003114/device/rss/rss.html");

            List<NewsItem> foundNewsItems = new List<NewsItem>();
            // try max 5 downloads to leave the tread for sure (call this method repeats continuosly)
            int retryCount = 0;
            while ((foundNewsItems.Count < 1) && (retryCount < 5))
            {
                foundNewsItems = ReadRSS(rssFeedUrl, NewsSource.CnbcRss, "");
                if (foundNewsItems.Count == 0)
                    System.Threading.Thread.Sleep(m_sleepBetweenDnsMs.Key + m_random.Next(m_sleepBetweenDnsMs.Value));
                retryCount++;
            }
            AddFoundNews(0, foundNewsItems);
            // return NewsToString(m_newsMemory[0]);
            return m_newsMemory[0];
        }

        internal List<string> GetStockTickers()
        {
            return new List<string> { "All assets" }.Union(m_stockTickers).ToList();
        }

        internal List<NewsItem> GetStockNews()
        {
            List<NewsItem> foundNewsItems = new List<NewsItem>();
            foreach (string ticker in m_stockTickers)
            {
                string rssFeedUrl = string.Format(@"https://feeds.finance.yahoo.com/rss/2.0/headline?s={0}&region=US&lang=en-US", ticker);
                foundNewsItems.AddRange(ReadRSS(rssFeedUrl, NewsSource.YahooRSS, ticker));
            }
            return foundNewsItems;
        }

        private string NewsToString(List<NewsItem> newsList)
        {
            string finalString = string.Empty;
            foreach (NewsItem news in newsList.OrderBy(x => x.PublishDate))
                finalString += string.Format(@"news_ticker{0}news_title{1}news_summary{2}news_link{3}news_downloadTime{4:yyyy-MM-dd hh:mm}news_publishDate{5:yyyy-MM-dd hh:mm}news_source{6}news_end",
                    news.Ticker, news.Title, news.Summary, news.LinkUrl, news.DownloadTime, news.PublishDate, news.Source);
            return finalString;
        }


        private void AddFoundNews(int p_stockID, List<NewsItem> p_foundNewsItems)
        {
            List<NewsItem> notYetKnownNews = new List<NewsItem>();
            if (!m_newsMemory.ContainsKey(p_stockID))
                m_newsMemory.Add(p_stockID, new List<NewsItem>());
            foreach (NewsItem newsItem in p_foundNewsItems)
                if (m_newsMemory[p_stockID].Where(x => x.LinkUrl.Equals(newsItem.LinkUrl)).Count() == 0)    // not yet known
                {
                    m_newsMemory[p_stockID].Add(newsItem);
                    notYetKnownNews.Add(newsItem);
                }
        }

        private static List<NewsItem> ReadRSS(string p_url, NewsSource p_newsSource, string p_ticker)
        {
            try
            {
                var webClient = new WebClient();
                // hide ;-)
                webClient.Headers.Add("user-agent", "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.2; .NET CLR 1.0.3705;)");
                // fetch feed as string
                var content = webClient.OpenRead(p_url);
                var contentReader = new StreamReader(content);
                var rssFeedAsString = contentReader.ReadToEnd();
                // convert feed to XML using LINQ to XML and finally create new XmlReader object
                var feed = System.ServiceModel.Syndication.SyndicationFeed.Load(XDocument.Parse(rssFeedAsString).CreateReader());

                List<NewsItem> foundNews = new List<NewsItem>();

                foreach (SyndicationItem item in feed.Items)
                {
                    NewsItem newsItem = new NewsItem();
                    newsItem.Ticker = p_ticker;
                    newsItem.LinkUrl = item.Links[0].Uri.AbsoluteUri;
                    newsItem.Title = item.Title.Text;
                    newsItem.Summary = item.Summary.Text;
                    newsItem.PublishDate = item.PublishDate.LocalDateTime;
                    newsItem.DownloadTime = DateTime.Now;
                    newsItem.Source = p_newsSource.ToString();
                    //newsItem.setFiltered();

                    foundNews.Add(newsItem);
                }
                return foundNews;
            }
            catch (Exception exception)
            {
                Console.WriteLine(exception.Message);
                return new List<NewsItem>();
            }
        }
    }
}