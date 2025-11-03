FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    supervisor

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy application files
COPY . /var/www

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set permissions
RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www/storage \
    && chmod -R 755 /var/www/bootstrap/cache

# No nginx; we'll use PHP's built-in server for simplicity on free tier

# Create supervisor config
RUN echo '[supervisord]\n\
nodaemon=true\n\
\n\
[program:web]\n\
command=php /var/www/artisan serve --host=0.0.0.0 --port=$PORT\n\
autostart=true\n\
autorestart=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0\n\
\n\
[program:reverb]\n\
command=php /var/www/artisan reverb:start --host=0.0.0.0 --port=8080\n\
autostart=true\n\
autorestart=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0\n\
\n\
[program:scheduler]\n\
command=/bin/bash -c "while true; do php /var/www/artisan schedule:run --verbose --no-interaction; sleep 60; done"\n\
autostart=true\n\
autorestart=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0' > /etc/supervisor/conf.d/laravel.conf

# Create startup script
RUN echo '#!/bin/bash\n\
php artisan key:generate --force || true\n\
php artisan config:cache\n\
php artisan migrate --force || true\n\
supervisord -c /etc/supervisor/supervisord.conf' > /start.sh && chmod +x /start.sh

EXPOSE $PORT

CMD ["/start.sh"]
