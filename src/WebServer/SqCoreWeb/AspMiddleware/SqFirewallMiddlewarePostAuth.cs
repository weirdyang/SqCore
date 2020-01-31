
using Microsoft.AspNetCore.Http;
using SqCommon;
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using static SqCoreWeb.WsUtils;

namespace SqCoreWeb
{
    internal class SqFirewallMiddlewarePostAuth
    {
        private static readonly NLog.Logger gLogger = NLog.LogManager.GetCurrentClassLogger();   // the name of the logger will be the "Namespace.Class"

        readonly RequestDelegate _next;

        public SqFirewallMiddlewarePostAuth(RequestDelegate next)
        {
            if (next == null)
                throw new ArgumentNullException(nameof(next));
            _next = next;
        }

        public async Task Invoke(HttpContext httpContext)
        {
            if (httpContext == null)
                throw new ArgumentNullException(nameof(httpContext));

            // 1. checks user auth for some staticFiles (like HTMLs, Controller APIs), but not for everything (not jpg, CSS, JS)
            var userAuthCheck = WsUtils.CheckAuthorizedGoogleEmail(httpContext);
            if (userAuthCheck != UserAuthCheckResult.UserKnownAuthOK)   
            {
                // It would be impossible task if subdomains are converted to path BEFORE this user auth check.
                // if "https://dashboard.sqcore.net" rewriten to  "https://sqcore.net/webapps/MarketDashboard/index.html" then login is //dashboard.sqcore.net/UserAccount/login
                // if "https://healthmonitor.sqcore.net" rewriten to.....
                // Otherwise, we redirect user to https://sqcore.net/UserAccount/login

                // if user is unknown or not allowed: log it but allow some files (jpeg) through, but not html or APIs
                string msg = String.Format($"{DateTime.UtcNow.ToString("HH':'mm':'ss.f")}#Uknown or not allowed user request should be redirected to Login: {httpContext.Request.Method} '{httpContext.Request.Path}' from {WsUtils.GetRequestIP(httpContext)}");
                Console.WriteLine(msg);
                gLogger.Info(msg);

                string ext = Path.GetExtension(httpContext.Request.Path.Value) ?? String.Empty;
                bool isAllowedRequest = false;
                
                if (ext.Equals(".html", StringComparison.OrdinalIgnoreCase) || ext.Equals(".htm", StringComparison.OrdinalIgnoreCase))   // 1. HTML requests
                {
                    // Allow without user login only for the main domain's index.html ("sqcore.net/index.html"),  
                    // For subdomains, like "dashboard.sqcore.net/index.html" require UserLogin
                    if (httpContext.Request.Host.Host.StartsWith("sqcore.net") &&   
                        httpContext.Request.Path.Value.Equals("/index.html", StringComparison.OrdinalIgnoreCase))   // if it is HTML only allow '/index.html' through
                        isAllowedRequest = true;
                } else if (String.IsNullOrEmpty(ext))  // 2. API requests
                {
                    if (httpContext.Request.Path.Value.Equals("/UserAccount/login", StringComparison.OrdinalIgnoreCase))   // if it is an API call only allow '/UserAccount/login' through. 
                        isAllowedRequest = true;
                }
                else 
                    isAllowedRequest = true;    // 3. allow jpeg files and other resources, like favicon.ico

                if (!isAllowedRequest)
                {
                    httpContext.Response.Redirect("/UserAccount/login", true);  // forced login. Even for main /index.html
                    // raw Return in Kestrel chain would give client a response header: status: 200 (OK), Data size: 0. Browser will present a blank page. Which is fine now.
                    // httpContext.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    // await httpContext.Response.WriteAsync("Unauthorized request! Login on the main page with an authorized user."); // text response is quick and doesn't consume too much resource
                    return;
                }
            }

            await _next(httpContext);
        }

    }
}