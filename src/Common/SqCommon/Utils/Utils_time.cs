﻿using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace SqCommon
{

    public enum TimeZoneId : byte {  UTC = 0, EST = 1, London = 2, CET = 3, Unknown=255 }  // similar to dbo.StockExchange.TimeZone

    public static partial class Utils
    {
        private static ConcurrentDictionary<TimeZoneId, TimeZoneInfo> g_tzi = new ConcurrentDictionary<TimeZoneId, TimeZoneInfo>();

        //http://www.mcnearney.net/blog/windows-timezoneinfo-olson-mapping/
        //http://unicode.org/repos/cldr/trunk/common/supplemental/windowsZones.xml
        //string londonZoneId = "GMT Standard Time";      // Linux: "Europe/London"

        // http://mono.1490590.n4.nabble.com/Cross-platform-time-zones-td1507630.html
        //In windows the timezones have a descriptive name such as "Eastern 
        //Standard Time" but in linux the same timezone has the name 
        //"US/Eastern". 
        //Is there a cross platform way of running
        //TimeZoneInfo.FindSystemTimeZoneById that can be used both in linux and
        //windows, or would i have to add additional code to check what platform
        //i am running before getting the time zone.
        //WINDOWS TIMEZONE ID DESCRIPTION                UNIX TIMEZONE ID
        //Eastern Standard Time => GMT - 5 w/DST             => US/Eastern
        //Central Standard Time => GMT - 6 w/DST             => US/Central
        //US Central Standard Time  => GMT-6 w/o DST(Indiana) => US / Indiana - Stark
        //Mountain Standard Time    => GMT-7 w/DST             => US/Mountain
        //US Mountain Standard Time => GMT-7 w/o DST(Arizona) => US / Arizona
        //Pacific Standard Time     => GMT-8 w/DST             => US/Pacific
        //Alaskan Standard Time => GMT - 9 w/DST             => US/Alaska
        //Hawaiian Standard Time => GMT - 10 w/DST            => US/Hawaii
        public static TimeZoneInfo FindSystemTimeZoneById(TimeZoneId p_tzType)
        {
            switch (p_tzType)
            {
                case TimeZoneId.UTC:
                    return TimeZoneInfo.Utc;
                default:
                    if (g_tzi.TryGetValue(p_tzType, out TimeZoneInfo tzi))
                        return tzi;
                    string zoneId;
                    switch (p_tzType)
                    {
                        case TimeZoneId.London:
                            if (Utils.RunningPlatform() == Platform.Windows)
                                zoneId = "GMT Standard Time";
                            else
                                zoneId = "Europe/London";
                            break;
                        case TimeZoneId.EST:
                            if (Utils.RunningPlatform() == Platform.Windows)
                                zoneId = "Eastern Standard Time";
                            else
                                zoneId = "America/New_York";        // or "US/Eastern". We have to test it.
                            break;
                        case TimeZoneId.CET:
                            if (Utils.RunningPlatform() == Platform.Windows)
                                zoneId = "Central Europe Standard Time";
                            else
                                zoneId = "Europe/Budapest";
                            break;
                        default:
                            throw new Exception($"TimeZoneType {p_tzType} is unexpected.");
                    }
                    try
                    {
                        tzi = TimeZoneInfo.FindSystemTimeZoneById(zoneId);
                    }
                    catch (Exception e)
                    {
                        Utils.Logger.Error("ERROR: Unable to find the {0} zone in the registry. {1}", zoneId, e.Message);
                    }
                    g_tzi[p_tzType] = tzi;
                    return tzi;

            }
            
        }

        public static DateTime ConvertTimeFromEtToUtc(DateTime p_dateTimeET)
        {
            TimeZoneInfo utcZone = TimeZoneInfo.Utc;
            TimeZoneInfo? estZone = null;
            try
            {
                estZone = Utils.FindSystemTimeZoneById(TimeZoneId.EST);
            }
            catch (Exception e)
            {
                Utils.Logger.Error(e, "Exception because of TimeZone conversion ");
                return DateTime.MaxValue;
            }

            return TimeZoneInfo.ConvertTime(p_dateTimeET, estZone, utcZone);
        }

        public static DateTime FromEtToUtc(this DateTime p_dateTimeEt)
        {
            return Utils.ConvertTimeFromEtToUtc(p_dateTimeEt);
        }

        public static DateTime ConvertTimeFromUtcToEt(DateTime p_dateTimeUtc)
        {
            TimeZoneInfo utcZone = TimeZoneInfo.Utc;
            TimeZoneInfo? estZone = null;
            try
            {
                estZone = Utils.FindSystemTimeZoneById(TimeZoneId.EST);
            }
            catch (Exception e)
            {
                Utils.Logger.Error(e, "Exception because of TimeZone conversion ");
                return DateTime.MaxValue;
            }

            return TimeZoneInfo.ConvertTime(p_dateTimeUtc, utcZone, estZone);
        }

        public static DateTime FromUtcToEt(this DateTime p_dateTimeUtc)
        {
            return Utils.ConvertTimeFromUtcToEt(p_dateTimeUtc);
        }


        public static DateTime UnixTimeStampToDateTimeUtc(long p_unixTimeStamp)      // Int would roll over to a negative in 2038 (if you are using UNIX timestamp), so long is safer
        {
            // Unix timestamp is seconds past epoch
            System.DateTime dtDateTime = new DateTime(1970, 1, 1, 0, 0, 0, 0, System.DateTimeKind.Utc);
            dtDateTime = dtDateTime.AddSeconds(p_unixTimeStamp);
            return dtDateTime;
        }

        //public static DateTime UnixTimeStampToDateTimeLoc(long p_unixTimeStamp)      // Int would roll over to a negative in 2038 (if you are using UNIX timestamp), so long is safer
        //{
        //    return UnixTimeStampToDateTimeUtc(p_unixTimeStamp).ToLocalTime();
        //}

        public static long DateTimeUtcToUnixTimeStamp(DateTime p_utcDate)      // Int would roll over to a negative in 2038 (if you are using UNIX timestamp), so long is safer
        {
            // Unix timestamp is seconds past epoch
            System.DateTime dtDateTime = new DateTime(1970, 1, 1, 0, 0, 0, 0, System.DateTimeKind.Utc);
            TimeSpan span = p_utcDate - dtDateTime;
            return (long)span.TotalSeconds;
        }

    }
}
