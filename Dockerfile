FROM php:8.4.27-apache

# フロントエンドのビルド結果をコピー
COPY dist /var/www/html/
# PHPのバックエンドディレクトリをコピー（distに含まれていない場合）
COPY backend /var/www/html/backend/

# Apacheユーザー（www-data）に書き込み権限を付与
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
