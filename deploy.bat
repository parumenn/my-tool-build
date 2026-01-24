@echo off
setlocal enabledelayedexpansion

echo --- 1. ビルドを開始します ---
call npm run build

echo --- 2. GitHub側の変更（READMEなど）を取り込みます ---
:: 先にリモートの変更を取得して合体させます
git pull origin master --rebase

echo --- 3. Gitの無視設定を上書きして追加します ---
git add -f dist/
git add .

echo --- 4. コミットして送信します ---
set datetime=%date% %time%
git commit -m "forced update !datetime!"
git push origin master

echo.
echo --- 完了！GitHubのページを確認してください ---
pause