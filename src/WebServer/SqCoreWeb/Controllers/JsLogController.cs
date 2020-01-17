using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SqCommon;
using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;
using System.Collections.Generic;

namespace SqCoreWeb.Controllers
{
    // Logger for Javascript code. This can notify Healthmonitor if Crash occurs in HTML JS in the client side.
    public class JsLogController : Controller
    {
        // http://stackoverflow.com/questions/16996713/receiving-a-http-post-in-http-handler
        [HttpGet, HttpPost]
        public async Task<ActionResult> Index()
        {
            string jsLogMessage = String.Empty;
            using (var reader = new StreamReader(Request.Body))
            {
                // This will equal to "charset = UTF-8 & param1 = val1 & param2 = val2 & param3 = val3 & param4 = val4"
                jsLogMessage = await reader.ReadToEndAsync();
            }

            // 1. just log the event to our file log
            var clientIP = WsUtils.GetRequestIP(this.HttpContext);
            var clientUserEmail = WsUtils.GetRequestUser(this.HttpContext);
            if (clientUserEmail == null)
                clientUserEmail = "UnknownUser@gmail.com";

            string jsLogMsgWithOrigin = $"Javascript Logger /JsLogController was called by '{clientUserEmail}' from '{clientIP}'. Received JS log: '{jsLogMessage}'";
            Utils.Logger.Info(jsLogMsgWithOrigin);

            // 2. interpret the log and if it is an error, notify HealthMonitor
            var jsLogObj = JsonSerializer.Deserialize(jsLogMessage, typeof(Dictionary<string, string>)) as Dictionary<string, string>;  
            string logLevel = (jsLogObj != null) ? jsLogObj["level"] : String.Empty;
            if (logLevel == "ERROR" || logLevel == "FATAL")
            {   // notify HealthMonitor to send an email
                HealthMonitorMessage.SendAsync(jsLogMsgWithOrigin, HealthMonitorMessageID.ReportErrorFromSQLabWebsite).RunSynchronously();
            }
            return NoContent(); // The common use case is to return 204 (NoContent) as a result of a PUT request, updating a resource
        }
    }
}
