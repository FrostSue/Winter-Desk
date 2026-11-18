Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
}

public class WindowHunter {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll", EntryPoint = "GetWindowLong")]
    public static extern int GetWindowLong(IntPtr hWnd, int nIndex);
}
"@ -ErrorAction SilentlyContinue

$windows = [System.Collections.ArrayList]::new()

$callback = [WindowHunter+EnumWindowsProc]{
    param($hwnd, $lparam)
    if ([WindowHunter]::IsWindowVisible($hwnd) -and -not [WindowHunter]::IsIconic($hwnd)) {
        $exStyle = [WindowHunter]::GetWindowLong($hwnd, -20)
        $isToolWindow = ($exStyle -band 0x80) -ne 0
        if (-not $isToolWindow) {
            $r = New-Object RECT
            if ([WindowHunter]::GetWindowRect($hwnd, [ref]$r)) {
                $w = $r.Right - $r.Left
                $h = $r.Bottom - $r.Top
                if ($w -ge 240 -and $h -ge 160 -and $r.Top -ge 0 -and $r.Left -ge -20) {
                    $windows.Add(@{ x = $r.Left; y = $r.Top; width = $w; height = $h }) | Out-Null
                }
            }
        }
    }
    return $true
}

[WindowHunter]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null

if ($windows.Count -eq 0) {
    Write-Output "[]"
} else {
    $windows | ConvertTo-Json -Compress
}
