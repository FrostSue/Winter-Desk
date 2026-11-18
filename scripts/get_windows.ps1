Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
}

public class WinInfo {
    public int x { get; set; }
    public int y { get; set; }
    public int width { get; set; }
    public int height { get; set; }
    public string title { get; set; }
}

public class WindowHunter {
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenWindowStation(string lpszWinSta, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetProcessWindowStation(IntPtr hWinSta);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll", EntryPoint = "GetWindowLong")]
    public static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    public static List<WinInfo> FindWindows() {
        var results = new List<WinInfo>();
        IntPtr hwinsta = OpenWindowStation("winsta0", false, 0x037F);
        if (hwinsta != IntPtr.Zero) {
            SetProcessWindowStation(hwinsta);
        }
        IntPtr hdesk = OpenDesktop("default", 0, false, 0x01FF);
        if (hdesk == IntPtr.Zero) return results;

        EnumDesktopWindows(hdesk, (hWnd, lParam) => {
            if (IsWindowVisible(hWnd) && !IsIconic(hWnd)) {
                int exStyle = GetWindowLong(hWnd, -20);
                if ((exStyle & 0x80) == 0) {
                    var sb = new StringBuilder(256);
                    GetWindowText(hWnd, sb, 256);
                    string title = sb.ToString();
                    if (!string.IsNullOrWhiteSpace(title) && title != "Program Manager" && title != "WinterDesk") {
                        RECT r;
                        if (GetWindowRect(hWnd, out r)) {
                            int w = r.Right - r.Left;
                            int h = r.Bottom - r.Top;
                            if (w >= 180 && h >= 100 && r.Top >= 0 && r.Left >= -20) {
                                results.Add(new WinInfo {
                                    x = r.Left,
                                    y = r.Top,
                                    width = w,
                                    height = h,
                                    title = title
                                });
                            }
                        }
                    }
                }
            }
            return true;
        }, IntPtr.Zero);
        return results;
    }
}
"@ -ErrorAction SilentlyContinue

$list = [WindowHunter]::FindWindows()
if ($null -eq $list -or $list.Count -eq 0) {
    Write-Output "[]"
} else {
    $list | ConvertTo-Json -Compress
}
