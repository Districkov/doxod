# Vercel Environment Variables Setup

Для работы приложения на Vercel нужно настроить следующие переменные окружения:

## Обязательные переменные:

### 1. DATABASE_URL
PostgreSQL connection string для Neon или другого провайдера:
```
postgresql://user:password@host/database?sslmode=require
```

### 2. AUTH_SECRET (или NEXTAUTH_SECRET)
Секретный ключ для NextAuth. Сгенерируйте командой:
```bash
openssl rand -base64 32
```
Или используйте онлайн генератор: https://generate-secret.vercel.app/32

## Опциональные переменные:

### NEXTAUTH_URL
URL вашего приложения (Vercel устанавливает автоматически):
```
https://doxod-one.vercel.app
```

## Как добавить на Vercel:

1. Зайдите в проект на https://vercel.com
2. Settings → Environment Variables
3. Добавьте каждую переменную
4. Выберите окружения: Production, Preview, Development
5. Сохраните и передеплойте проект

## Проверка:

После настройки переменных:
1. Redeploy проекта на Vercel
2. Проверьте логи деплоя на наличие ошибок
3. Попробуйте зарегистрироваться на /register
