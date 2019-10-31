``` ini

BenchmarkDotNet=v0.11.5, OS=Windows 10.0.17763.737 (1809/October2018Update/Redstone5)
Intel Core i9-9900K CPU 3.60GHz (Coffee Lake), 1 CPU, 16 logical and 8 physical cores
.NET Core SDK=3.0.100-preview9-014004
  [Host]     : .NET Core 3.0.0-preview9-19423-09 (CoreCLR 4.700.19.42102, CoreFX 4.700.19.42104), 64bit RyuJIT
  DefaultJob : .NET Core 3.0.0-preview9-19423-09 (CoreCLR 4.700.19.42102, CoreFX 4.700.19.42104), 64bit RyuJIT


```
|            Method |       Mean |     Error |    StdDev |  Gen 0 | Gen 1 | Gen 2 | Allocated |
|------------------ |-----------:|----------:|----------:|-------:|------:|------:|----------:|
| SplitStringString |   100.7 ns |  1.483 ns |  1.387 ns | 0.0401 |     - |     - |     336 B |
|  SplitStringRegex | 1,580.8 ns | 16.290 ns | 15.237 ns | 0.3376 |     - |     - |    2832 B |
