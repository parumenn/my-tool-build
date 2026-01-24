@echo off
echo --- 1. ビルドを開始します ---
call npm run build

echo --- 2. GitHubに送ります ---
git add .
git commit -m "auto update %date% %time%"
git push origin master

echo --- 完了！ラズパイ側で update.sh を実行してください ---
pause