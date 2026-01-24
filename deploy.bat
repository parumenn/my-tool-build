@echo off
setlocal enabledelayedexpansion

echo --- 1. ビルドを開始します ---
call npm run build

echo --- 2. GitHubへの送信準備 (assetsを強制追加) ---
:: .gitignoreを無視してdistフォルダを無理やり追加します
git add -f dist/

:: その他の変更も追加
git add .

echo --- 3. コミットして送信します ---
set datetime=%date% %time%
git commit -m "auto update !datetime!"
git push origin master

echo.
echo --- 完了！GitHubに assets フォルダがあるか確認してください ---
pause