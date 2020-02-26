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
        public void OnConnectedAsync_QuickfNews()
        {
            // don't do a long process here. Start big things in a separate thread. One way is in 'DashboardPushHub_mktHealth.cs'
            DashboardPushHubKestrelBckgrndSrv.HubContext?.Clients.All.SendAsync("quickfNewsOnConnected", "This message is to Laci, :) from the Webserver backend.");
        }

        public void OnDisconnectedAsync_QuickfNews(Exception exception)
        {
           
        }
    }
}