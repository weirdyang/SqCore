using System;

namespace SqCommon
{
    public enum TradingHours { PreMarket, RegularTrading, PostMarket, Closed }

    public static partial class Utils
    {
        // borrow code from SqLab, but clean that code
        public static bool DetermineUsaMarketTradingHours(DateTime p_timeUtc, out bool p_isMarketTradingDay, out DateTime p_openTimeUtc, out DateTime p_closeTimeUtc, TimeSpan p_maxAllowedStaleness)
        {
            throw new NotImplementedException();
        }

        // PreMarket: 4:00ET, Regular: 9:30ET, Post:16:00, Post-ends: 20:00
        public static TradingHours UsaTradingHoursNow()
        {
            // we should use Holiday day data from Nasdaq website later. See code in SqLab.
            DateTime etNow = Utils.ConvertTimeFromUtcToEt(DateTime.UtcNow);
            int nowTimeOnlySec = etNow.Hour * 60 * 60 + etNow.Minute * 60 + etNow.Second;
            if (nowTimeOnlySec < 4 * 60 * 60)
                return TradingHours.Closed;
            else if (nowTimeOnlySec < 9 * 60 * 60 + 30 * 60)
                return TradingHours.PreMarket;
            else if (nowTimeOnlySec < 16 * 60 * 60)
                return TradingHours.RegularTrading;
            else if (nowTimeOnlySec < 20 * 60 * 60)
                return TradingHours.PostMarket;
            else
                return TradingHours.Closed;
        }
    }

}