using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace SqCoreWeb
{
    public class ExSvPushHub : Hub
    {
        public async Task NewMessage(long username, string message)
        {
            await Clients.All.SendAsync("messageReceived", username, message);
        }
        public async Task StartStreaming(string message)
        {
            for (int i = 0; i < 15; i++) {
                await Clients.Caller.SendAsync("priceQuoteFromServer", "AAPL price is: $" + (new Random().NextDouble()*1000.0).ToString("0.00"));
                Thread.Sleep(2000);
            }
        }
    }
}