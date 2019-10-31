using System;


namespace SqCommon
{
   
    public static partial class Utils
    {

        // Double.Parse() uses the local Culture of the thread to decide whether to use a decimal point or a decimal comma. We should use InvariantCulture always.
        // To avoid using double.Parse("3.5", CultureInfo.InvariantCulture) all the time, we use this Util function.
        // https://stackoverflow.com/questions/55975211/nullable-reference-types-how-to-specify-t-type-without-constraining-to-class
        public static T InvariantConvert<T>(object p_val, bool p_ifNullAllowDefault = false) where T : struct   // int is struct, if p_val is null, in general we want to raise exception.
        {
            if (p_val == null && p_ifNullAllowDefault)
                return default(T);
            if (p_val is T)
                return (T)p_val;

            // Allows basic string->numeric/bool/DateTime conversions, but not: string->TimeSpan/enum/etc.
            if (p_val == null)
                throw new Exception("SqCommon.Utils.InvariantConvert(). Parameter object shouldn't be null.");
            else
                return (T)System.Convert.ChangeType(p_val.ToString(), typeof(T), System.Globalization.CultureInfo.InvariantCulture);
        }
        public static T? InvariantConvertNullableReference<T>(object p_val, bool p_ifNullAllowDefault = false) where T : class // string is class, not struct  // if p_val is null, in general we want to raise exception.
        {
            if (p_val == null && p_ifNullAllowDefault)
                return default(T);
            if (p_val is T)
                return (T)p_val;

            // Allows basic string->numeric/bool/DateTime conversions, but not: string->TimeSpan/enum/etc.
            if (p_val == null)
                throw new Exception("SqCommon.Utils.InvariantConvert(). Parameter object shouldn't be null.");
            else
                return (T)System.Convert.ChangeType(p_val.ToString(), typeof(T), System.Globalization.CultureInfo.InvariantCulture);
        }



    }

}