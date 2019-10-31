using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace SqCoreWeb.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AccountController : Controller
    {
        [HttpGet("[action]")]       // from the Route template "template: "{controller=Home}/{action=Index}/{id?}");" only action is used.
        public async Task Login(string? returnUrl) // (string returnUrl = "/")
        {
            await HttpContext.ChallengeAsync("Google",
                new AuthenticationProperties()
                {
                    RedirectUri = returnUrl ?? "/index.html"      // if http://localhost/api/account/login is called directly, there is no returnURL, which is null. However if we pass Null to GoogleAuth, it will come back to this "/login" which will cause an infinite loop. 
            });
        }

        [Authorize]
        [HttpGet("[action]")]
        public async Task Logout()
        {
            // TODO: redirect user to a nicer page that shows: ""You have been logged out. Goodbye " + context.User.Identity.Name + "<br>""
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme, new AuthenticationProperties
            {
                //RedirectUri = Url.Action("Index", "Home")
                RedirectUri = "/"
            });
        }

        [HttpGet("[action]")]
        public string NoAuthNeedWebserviceSample()
        {
            var userEmailClaim = HttpContext?.User?.Claims?.FirstOrDefault(p => p.Type == @"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress");
            string email = userEmailClaim?.Value ?? "Unknown email";

            return "No authorization for this. For Testing purposes. Your email is: " + email;
        }

        [Authorize]     // this attribute will direct user to GoogleLogin, but in its pure form, it would allow any google email users to log in, so we need more secure than this.
        [HttpGet("[action]")]
        public IActionResult Profile()
        {
            // this accepts any Google logins
            return View();
        }

        [Authorize]
        [HttpGet("[action]")]
        public string SelectedGoogleUsersAuthNeedWebserviceSample()
        {
            var userEmailClaim = HttpContext?.User?.Claims?.FirstOrDefault(p => p.Type == @"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress");
            string email = userEmailClaim?.Value  ?? "Unknown email";

            if (!String.Equals(email, "foo@google.com"))
                return "You don't belong to our precious users. Your email is: " + email;

            return "You are one of our precious users. Cheers. Your email is: " + email;
        }

        
    }
}