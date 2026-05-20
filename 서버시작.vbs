Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /k ""cd /d c:\Users\palin\Desktop\낚시GO\server && npm run dev""", 1, False
WScript.Sleep 3000
WshShell.Run "cmd /k ""cd /d c:\Users\palin\Desktop\낚시GO && npm run dev""", 1, False
WScript.Sleep 10000
WshShell.Run "http://localhost:5173"
