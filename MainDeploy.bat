@echo off
setlocal
chcp 64101 > nul

echo ZIPファイルを選択してください...

:: 1. PowerShellを呼び出してファイル選択ダイアログを表示
set "psCommand="(new-object -com shell.application).browseforfolder(0,'ZIPファイルを選択してください',0x4000,0).self.path""
for /f "usebackq delims=" %%I in (`powershell -command %psCommand%`) do set "zipFile=%%I"

:: ファイルが選択されなかった場合は終了
if "%zipFile%"=="" (
    echo ファイルが選択されませんでした。
    pause
    exit /b
)

:: 展開先パスの設定
set "destDir=G:\Documents\プログラム\まいつーる\展開ファイル"

:: 展開先のディレクトリがない場合は作成
if not exist "%destDir%" mkdir "%destDir%"

echo 展開中: %zipFile%
echo 展開先: %destDir%

:: 2. PowerShellで展開（-Force で上書き指定）
powershell -command "Expand-Archive -Path '%zipFile%' -DestinationPath '%destDir%' -Force"

echo.
echo 展開が完了しました。
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