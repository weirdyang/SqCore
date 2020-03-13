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
    
    public partial class DashboardPushHub : Hub
    {
        const int m_newsReloadInterval = 1 * 10 * 1000; // 5 minutes in milliseconds 
        Timer m_newsReloadTimer;
        QuickfolioNewsDownloader m_newsDownloader = new QuickfolioNewsDownloader();

        public DashboardPushHub()
        {
            m_newsReloadTimer = new Timer(NewsReloadTimerElapsed, null, m_newsReloadInterval, m_newsReloadInterval);
        }
        public void OnConnectedAsync_QuickfNews()
        {
            // don't do a long process here. Start big things in a separate thread. One way is in 'DashboardPushHub_mktHealth.cs'
            // DashboardPushHubKestrelBckgrndSrv.HubContext?.Clients.All.SendAsync("quickfNewsOnConnected", "This message is to Laci, :) from the Webserver backend.");
            TriggerQuickfolioNewsDownloader();
        }

        private void TriggerQuickfolioNewsDownloader()
        {
            List<NewsItem> commonNews = m_newsDownloader.GetCommonNews();
            DashboardPushHubKestrelBckgrndSrv.HubContext?.Clients.All.SendAsync("quickfNewsOnConnected", commonNews);
            List<NewsItem> stockNews = m_newsDownloader.GetStockNews();
            DashboardPushHubKestrelBckgrndSrv.HubContext?.Clients.All.SendAsync("quickfNewsOnConnectedStocks", stockNews);
        }

        public void OnDisconnectedAsync_QuickfNews(Exception exception)
        {
        }
        private void NewsReloadTimerElapsed(object? state)
        {
            if (DashboardPushHub.g_clients.Count > 0) 
            {
                TriggerQuickfolioNewsDownloader();
            }
        }

    }
}