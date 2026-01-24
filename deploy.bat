@echo off
setlocal enabledelayedexpansion

echo --- 1. ビルドを開始します ---
call npm run build

echo --- 2. 手元の変更を一旦Gitに預けます ---
:: .gitignoreを無視してdistフォルダを強制追加
git add -f dist/
git add .
set datetime=%date% %time%
git commit -m "pre-rebase update !datetime!"

echo --- 3. GitHub側の変更を取り込んで合体させます ---
:: これでREADMEの編集分などがローカルに反映されます
git pull origin master --rebase

echo --- 4. 最後にGitHubへ送りつけます ---
git push origin master

echo.
echo ---完了！GitHubの dist/assets を確認してください ---
pause