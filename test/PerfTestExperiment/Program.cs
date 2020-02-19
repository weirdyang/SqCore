using System;
using System.Security.Cryptography;
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

using System.Linq;


namespace MyBenchmarks
{

    [MemoryDiagnoser] // we need to enable it in explicit way to get Columns for ' Gen X collections per 1 000 Operations' and MemAlloc
    public class SqBenchmarks1
    {
        [Benchmark]
        public byte[] EmptyArray() => Array.Empty<byte>();

        [Benchmark]
        public byte[] EightBytes() => new byte[8];

        [Benchmark]
        [Arguments(0, 100)]
        [Arguments(0, 200)]
        public byte[] SomeLinq(int start, int end)
        {
            return Enumerable
                .Range(start, end)
                .Where(i => i % 2 == 0)
                .Select(i => (byte)i)
                .ToArray();
        }
    }


    [MemoryDiagnoser] // we need to enable it in explicit way to get Columns for ' Gen X collections per 1 000 Operations' and MemAlloc
    public class SqBenchmarks2
    {
        [Params(10, 100, 1000)]
        public int N;

        private int[] data;

        [GlobalSetup]
        public void GlobalSetup()
        {
            data = new int[N]; // executed once per each N value
        }

        [Benchmark]
        public int LogicToBenchmark()
        {
            int res = 0;
            for (int i = 0; i < N; i++)
                res += data[i];
            return res;
        }

        [GlobalCleanup]
        public void GlobalCleanup()
        {
            // Disposing logic (once per each N value)
        }
    }


    [MemoryDiagnoser] // we need to enable it in explicit way to get Columns for ' Gen X collections per 1 000 Operations' and MemAlloc
    public class SqBenchmarks3
    {
        string splitThisStr = "bla, bla, bla, this will, benchmark, this.";

        [Benchmark]
        public void SplitStringByString()
        {
            SqCommon.Utils.SplitStringByCharArray(splitThisStr);       // mean run:  103.7 ns, allocated: 336 Byte
        }

        [Benchmark]
        public void SplitStringByRegex()
        {
            SqCommon.Utils.SplitStringByRegex(splitThisStr);        // mean run:  1,592.2 ns  (15x more).  allocated: 2,832 Byte. (x8 more) Try to avoid RegEx!!!
        }


    }



    // Do your own experiment here
    [MemoryDiagnoser]
    public class SqBenchmarks4
    {

        [Benchmark]
        public void FunctionVersion1()
        {
            
        }

        [Benchmark]
        public void FunctionVersion2()
        {
            
        }
    }



    public class Program
    {
        public static void Main(string[] args)
        {
            //var summary1 = BenchmarkRunner.Run<SqBenchmarks1>();
            //var summary2 = BenchmarkRunner.Run<SqBenchmarks2>();
            var summary3 = BenchmarkRunner.Run<SqBenchmarks3>();
            //var summary4 = BenchmarkRunner.Run<SqBenchmarks4>();      // Do your own experiment here

            Console.WriteLine("Press any key and ENTER to end the program and close the terminal...");
            Console.ReadLine();   // this can prevent closing if it is running by the Debugger. But it should be commented out if it is run as a Task in the internal terminal.
        }
    }
}