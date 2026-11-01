FROM nginx:alpine
# ↓↓↓ビルド時のファイル群をK8S環境内のコンテナに入れるシーケンス。
COPY dist /usr/share/nginx/html
EXPOSE 80
