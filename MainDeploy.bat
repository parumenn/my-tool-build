@echo off
setlocal
chcp 65001 > nul

echo --- ファイル選択 ---
set "psCommand=Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = 'ZIPファイル (*.zip)|*.zip'; $f.ShowDialog() | Out-Null; $f.FileName"
for /f "usebackq delims=" %%I in (`powershell -command "%psCommand%"`) do set "zipFile=%%I"

if "%zipFile%"=="" (
    echo ファイルが選択されませんでした。
    pause
    exit /b
)

echo 展開を開始します...
powershell -command "Expand-Archive -Path '%zipFile%' -DestinationPath 'G:\Documents\プログラム\まいつーる\展開ファイル' -Force"

if %errorlevel% neq 0 (
    echo 展開に失敗しました。
    pause
    exit /b
)

echo 展開が完了しました。

pushd "G:\Documents\プログラム\まいつーる\展開ファイル"

echo --- 1. ビルドを開始します ---
call npm install
call npm run build

echo --- 2. 手元の変更をGitに記録します ---
:: distフォルダを強制的にステージングに追加
git add dist -f
git add --all -- ":!README.md"

set datetime=%date% %time%
git commit -m "deploy update %datetime%"

echo --- 3. GitHubへ同期します ---
git push -f origin master

popd
echo --- 完了 ---
pause