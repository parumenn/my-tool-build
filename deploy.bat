@echo off
setlocal enabledelayedexpansion

echo --- 1. ビルドを開始します ---
call npm run build

echo --- 2. Gitの無視設定を上書きして追加します ---
:: .gitignoreを無視してdistフォルダを強制的にステージングします
git add -f dist/
:: その他の変更も一括で追加
git add .

echo --- 3. GitHubへ送信します ---
set datetime=%date% %time%
git commit -m "forced update !datetime!"
git push origin master

echo.
echo --- 完了！GitHubのページをリロードして assets があるか見てください ---
pause