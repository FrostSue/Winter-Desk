using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

namespace WindowTracker {
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    class Program {
        [DllImport("user32.dll", SetLastError = true)]
        static extern IntPtr OpenWindowStation(string lpszWinSta, bool fInherit, uint dwDesiredAccess);

        [DllImport("user32.dll", SetLastError = true)]
        static extern bool SetProcessWindowStation(IntPtr hWinSta);

        [DllImport("user32.dll", SetLastError = true)]
        static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

        delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true)]
        static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true)]
        static extern bool IsWindowVisible(IntPtr hWnd);

        [DllImport("user32.dll", SetLastError = true)]
        static extern bool IsIconic(IntPtr hWnd);

        [DllImport("user32.dll", SetLastError = true)]
        static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

        [DllImport("dwmapi.dll")]
        static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, out RECT pvAttribute, int cbAttribute);

        [DllImport("dwmapi.dll")]
        static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, out int pvAttribute, int cbAttribute);

        [DllImport("user32.dll")]
        static extern bool SetProcessDPIAware();

        [DllImport("user32.dll", EntryPoint = "GetWindowLong")]
        static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        const int DWMWA_EXTENDED_FRAME_BOUNDS = 9;
        const int DWMWA_CLOAKED = 14;

        static void Main(string[] args) {
            try {
                SetProcessDPIAware();
            } catch {
            }

            IntPtr hwinsta = OpenWindowStation("winsta0", false, 0x037F);
            if (hwinsta != IntPtr.Zero) SetProcessWindowStation(hwinsta);
            IntPtr hdesk = OpenDesktop("default", 0, false, 0x01FF);
            if (hdesk == IntPtr.Zero) return;

            string lastJson = "";

            while (true) {
                var list = new List<string>();

                EnumDesktopWindows(hdesk, (hWnd, lParam) => {
                    if (IsWindowVisible(hWnd) && !IsIconic(hWnd)) {
                        int cloaked = 0;
                        int cloakedRes = DwmGetWindowAttribute(hWnd, DWMWA_CLOAKED, out cloaked, sizeof(int));
                        if (cloakedRes == 0 && cloaked != 0) {
                            return true;
                        }

                        int exStyle = GetWindowLong(hWnd, -20);
                        if ((exStyle & 0x80) == 0) {
                            var sb = new StringBuilder(256);
                            GetWindowText(hWnd, sb, 256);
                            string title = sb.ToString();
                            if (!string.IsNullOrWhiteSpace(title) && title != "Program Manager" && title != "WinterDesk") {
                                RECT r;
                                int dwmRes = DwmGetWindowAttribute(hWnd, DWMWA_EXTENDED_FRAME_BOUNDS, out r, Marshal.SizeOf(typeof(RECT)));
                                bool gotRect = (dwmRes == 0) || GetWindowRect(hWnd, out r);

                                if (gotRect) {
                                    int w = r.Right - r.Left;
                                    int h = r.Bottom - r.Top;
                                    if (w >= 180 && h >= 100 && r.Top >= -40 && r.Left >= -40) {
                                        list.Add(string.Format("{{\"id\":{0},\"x\":{1},\"y\":{2},\"width\":{3},\"height\":{4}}}", (long)hWnd, r.Left, r.Top, w, h));
                                    }
                                }
                            }
                        }
                    }
                    return true;
                }, IntPtr.Zero);

                string json = "[" + string.Join(",", list.ToArray()) + "]";
                if (json != lastJson) {
                    lastJson = json;
                    Console.WriteLine(json);
                    Console.Out.Flush();
                }

                Thread.Sleep(25);
            }
        }
    }
}
