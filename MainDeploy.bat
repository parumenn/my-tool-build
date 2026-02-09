@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul

echo --- ファイル選択 ---
:: 1. ファイル選択ダイアログ（ファイル専用）を呼び出すように修正
set "psCommand=Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = 'ZIPファイル (*.zip)|*.zip'; $f.ShowDialog() | Out-Null; $f.FileName"

for /f "usebackq delims=" %%I in (`powershell -command "%psCommand%"`) do set "zipFile=%%I"

if "%zipFile%"=="" (
    echo ファイルが選択されませんでした。
    pause
    exit /b
)

:: 展開先パス（ここが空にならないよう固定、または適切に処理）
set "destDir=G:\Documents\プログラム\まいつーる\展開ファイル"
if not exist "%destDir%" mkdir "%destDir%"

echo 展開中: "%zipFile%"
echo 展開先: "%destDir%"

:: 2. パスをダブルクォーテーションで囲み、スペース対策を強化
powershell -command "Expand-Archive -Path '%zipFile%' -DestinationPath '%destDir%' -Force"

echo.
echo 展開が完了しました。

:: 展開先に移動してからビルドを実行する（ここ重要！）
pushd "%destDir%"

echo --- 1. ビルドを開始します ---
call npm install
call npm run build

echo --- 2. 手元の変更をGitに記録します ---
git add -f dist/
git add .
set datetime=%date% %time%
git commit -m "deploy update %datetime%"

echo --- 3. GitHubへ強制的に同期します ---
git push -f origin master

:: 元のディレクトリに戻る
popd

echo.
echo --- 完了！GitHubの dist/assets を確認してください ---
pause