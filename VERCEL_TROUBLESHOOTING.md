# Vercel Environment Variables - Checklist

## Проверьте, что на Vercel настроены ВСЕ переменные:

### 1. DATABASE_URL ✓
```
postgresql://username:password@host:5432/database?sslmode=require
```
**Где взять:** Neon, Supabase, Railway или другой PostgreSQL провайдер

### 2. AUTH_SECRET ✓ (ОБЯЗАТЕЛЬНО!)
```
Сгенерируйте: openssl rand -base64 32
```
**Важно:** NextAuth v5 требует именно `AUTH_SECRET` (не NEXTAUTH_SECRET)

Пример значения:
```
wX8kD9pLm3nQ7rT2vY5zA1bC4eF6gH8i
```

### 3. NEXTAUTH_URL (опционально)
```
https://doxod-one.vercel.app
```
**Примечание:** Vercel обычно устанавливает автоматически

## Как проверить на Vercel:

1. Откройте: https://vercel.com/districkov/doxod/settings/environment-variables
2. Убедитесь, что видите:
   - `DATABASE_URL` = `postgresql://...`
   - `AUTH_SECRET` = `какая-то-длинная-строка`
3. Проверьте, что переменные применены к Production
4. После добавления/изменения переменных ОБЯЗАТЕЛЬНО сделайте Redeploy

## Как сделать Redeploy:

1. Зайдите в Deployments: https://vercel.com/districkov/doxod
2. Найдите последний деплой
3. Нажмите три точки (•••) → Redeploy
4. Подождите 1-2 минуты

## Проверка после деплоя:

1. Откройте https://doxod-one.vercel.app/login
2. Если видите форму логина (не ошибку 500) - всё работает!
3. Попробуйте зарегистрироваться на /register

## Если всё равно ошибка:

Проверьте логи:
1. https://vercel.com/districkov/doxod
2. Откройте последний деплой
3. Вкладка "Function Logs"
4. Ищите ошибки с "AUTH_SECRET" или "prisma"
