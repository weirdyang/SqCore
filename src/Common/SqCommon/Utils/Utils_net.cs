using System;
using System.Net.Http;
using System.Net.Sockets;
using System.Threading;

namespace SqCommon
{
    public static partial class Utils
    {
        public static void TcpClientDispose(TcpClient p_tcpClient)
        {
            if (p_tcpClient == null)
                return;
            p_tcpClient.Dispose();
        }


        public static bool DownloadStringWithRetry(out string p_webpage, string p_url)
        {
            return DownloadStringWithRetry(out p_webpage, p_url, 3, TimeSpan.FromSeconds(2), true);
        }

        public static bool DownloadStringWithRetry(out string p_webpage, string p_url, int p_nRetry, TimeSpan p_sleepBetweenRetries, bool p_throwExceptionIfUnsuccesfull = true)
        {
            p_webpage = String.Empty;
            int nDownload = 0;
            do
            {

                try
                {
                    nDownload++;
                    p_webpage = new HttpClient().GetStringAsync(p_url).Result;
                    Utils.Logger.Debug(String.Format("DownloadStringWithRetry() OK:{0}, nDownload-{1}, Length of reply:{2}", p_url, nDownload, p_webpage.Length));
                    return true;
                }
                catch (Exception ex)
                {
                    // it is quite expected that sometimes (once per month), there is a problem:
                    // "The operation has timed out " or "Unable to connect to the remote server" exceptions
                    // Don't raise Logger.Error() after the first attempt, because it is not really Exceptional, and an Error email will be sent
                    Utils.Logger.Info(ex, "Exception in DownloadStringWithRetry()" + p_url + ":" + nDownload + ": " + ex.Message);
                    Thread.Sleep(p_sleepBetweenRetries);
                    if ((nDownload >= p_nRetry) && p_throwExceptionIfUnsuccesfull)
                        throw;  // if exception still persist after many tries, rethrow it to caller
                }
            } while (nDownload < p_nRetry);

            return false;
        }

    }
}