; 宽 Kuan 安装包脚本（Inno Setup 7，6 也能用）
; 用法：装好 Inno Setup 7（或 6）后，双击 build-installer.bat；或者用 Inno Setup 打开本文件，点「Compile」。
; 需要旁边有解压好的 Kuan 文件夹（先运行 join-and-extract.bat）。

#define AppName "宽 Kuan"
#define AppVersion "0.9.0"
#define AppExe "Kuan.exe"

[Setup]
AppId={{8D3C7A52-4E1B-4B5C-9F7E-6A2D1C0B9E34}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher=Zheyao Li
AppComments=osu! storyboard 编辑器
DefaultDirName={autopf}\Kuan
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
; 默认装给当前用户，不需要管理员权限；安装时也可以选「为所有用户安装」
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=Output
OutputBaseFilename=Kuan-Setup-{#AppVersion}
SetupIconFile=Kuan\icon.ico
UninstallDisplayIcon={app}\icon.ico
UninstallDisplayName={#AppName}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
CloseApplications=yes
#if Ver >= EncodeVer(7,0,0,0)
; Inno Setup 7：安装程序本身也是 64 位的
SetupArchitecture=x64
#endif

[Languages]
Name: "chinesesimp"; MessagesFile: "ChineseSimplified.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[CustomMessages]
chinesesimp.DesktopIcon=在桌面创建快捷方式
english.DesktopIcon=Create a desktop shortcut
chinesesimp.LaunchApp=现在打开 宽 Kuan
english.LaunchApp=Launch Kuan now

[Tasks]
Name: "desktopicon"; Description: "{cm:DesktopIcon}"

[Files]
Source: "Kuan\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExe}"; IconFilename: "{app}\icon.ico"
Name: "{group}\卸载 {#AppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExe}"; Description: "{cm:LaunchApp}"; Flags: nowait postinstall skipifsilent
