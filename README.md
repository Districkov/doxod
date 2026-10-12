```markdown
# doxod

Веб-приложение на **Next.js + TypeScript + Prisma** с фокусом на производительность
работы с данными.

🔗 **Демо:** https://doxod-one.vercel.app

## ⚡ Производительность
- **Индексы БД** под реальные запросы
- **Агрегатные запросы** вместо N+1
- **Пагинация** вместо выгрузки всего на клиент
- **Кеширование и single revalidation** для актуальных, но быстрых страниц

## 🛠 Стек
- Next.js (App Router), **TypeScript**
- **Prisma** + PostgreSQL
- Tailwind CSS, shadcn/ui
- ESLint

## 🚀 Запуск

```bash
npm install
cp .env.example .env    # укажи строку подключения к БД
npx prisma migrate dev  # применить миграции
npm run dev             # http://localhost:3000
```

## 📁 Структура
```
prisma/     # схема и миграции
src/        # исходный код
public/     # статика
```

## 👤 Автор
Иван Соломин — [github.com/Districkov](https://github.com/Districkov)
```
