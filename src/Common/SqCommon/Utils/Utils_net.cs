using System.Net.Sockets;

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

    }
}