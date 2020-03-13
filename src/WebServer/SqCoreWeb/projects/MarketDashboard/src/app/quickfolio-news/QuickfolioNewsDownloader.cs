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

        internal List<NewsItem> GetStockNews()
        {
            string[] stocks = { "AAPL", "ADBE", "AMZN", "BABA", "CRM", "FB", "GOOGL", "MA", "MSFT", "NVDA", "PYPL", "QCOM", "V" };
            List<NewsItem> foundNewsItems = new List<NewsItem>();
            foreach (string ticker in stocks)
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

        private static double GetUnixTimestamp(DateTime p_dateTime)
        {
            return (DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }
    }
}