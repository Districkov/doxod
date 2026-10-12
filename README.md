# doxod

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

Приложение для учёта доходов и расходов с мультивалютностью, наглядной аналитикой
и автоматизацией рутины: чеки распознаются сами, операции можно добавлять из
Telegram, а курсы валют подтягиваются из внешнего API.

🔗 **Демо:** https://doxod-one.vercel.app

## ✨ Возможности

- 🔐 **Аутентификация** — NextAuth (Auth.js v5) с Prisma-адаптером и хешированием паролей (bcryptjs)
- 💱 **Мультивалютность** — конвертация сумм по актуальным курсам через внешний API
- 📊 **Аналитика и графики** — динамика доходов и расходов на Recharts
- 🧾 **Распознавание чеков (OCR)** — автоматическое извлечение сумм с фотографий через OCR.space
- 🤖 **Telegram-бот** — добавление операций и уведомления прямо из мессенджера
- ⏰ **Ежедневные задачи по расписанию** — эндпоинт `/api/cron/daily`, защищённый секретом
- ✅ **Валидация входных данных** схемами Zod на уровне API
- 🖼 **Оптимизация изображений** через sharp
- 🔒 **Защита маршрутов** через middleware (неавторизованных не пускает внутрь)

## 🛠 Стек

| Слой | Технологии |
|------|-----------|
| Фреймворк | Next.js 16 (App Router), React 19 |
| Язык | TypeScript 5 |
| Данные | Prisma 5, PostgreSQL, миграции Prisma |
| Аутентификация | NextAuth (Auth.js) v5, `@auth/prisma-adapter`, bcryptjs |
| UI | Tailwind CSS 4, shadcn/ui, lucide-react, Base UI |
| Графики | Recharts |
| Валидация | Zod |
| Прочее | date-fns, sharp, dotenv |
| Качество | ESLint 9 (eslint-config-next) |

## ⚡ Производительность

- **Индексы в базе** под реальные запросы вместо полносканирования таблиц
- **Агрегатные запросы** вместо N+1 — статистика считается на стороне БД
- **Пагинация** — данные отдаются страницами, а не выгружаются целиком на клиент
- **Кеширование и single revalidation** — страницы остаются актуальными, но не пересобираются на каждый запрос

## 🏗 Архитектура

```
Клиент (React 19 / App Router)
        │
        ├── middleware.ts ──► защита маршрутов (сессия)
        │
        ├── src/app/      ──► страницы и route handlers
        ├── src/components/ ─► UI-компоненты
        ├── src/services/  ─► бизнес-логика и обращения к внешним API
        ├── src/lib/       ─► prisma-клиент, утилиты, конфиг
        └── src/types/     ─► общие типы
                    │
                    ▼
              Prisma ──► PostgreSQL
```

## 📁 Структура проекта

```
doxod/
├── prisma/
│   ├── schema.prisma        # схема данных
│   └── migrations/          # миграции
├── public/                  # статика
├── src/
│   ├── app/                 # App Router: страницы и API-роуты
│   ├── components/          # UI-компоненты
│   ├── lib/                 # prisma-клиент, утилиты
│   ├── services/            # бизнес-логика, внешние API
│   ├── types/               # типы TypeScript
│   └── middleware.ts        # защита маршрутов
├── components.json          # конфиг shadcn/ui
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── tsconfig.json
└── .env.example
```

## 📜 Скрипты

| Команда | Что делает |
|---------|-----------|
| `npm run dev` | Запуск в режиме разработки |
| `npm run build` | Прод-сборка |
| `npm run start` | Запуск собранного приложения |
| `npm run lint` | Проверка кода ESLint |
| `postinstall` | `prisma generate` + `prisma db push` |

## 🔑 Переменные окружения

Скопируй `.env.example` в `.env` и заполни:

| Переменная | Назначение |
|-----------|-----------|
| `DATABASE_URL` | Строка подключения к PostgreSQL |
| `AUTH_SECRET` | Секрет NextAuth (сгенерировать: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Публичный адрес приложения |
| `EXCHANGE_RATE_API_KEY` | Ключ API курсов валют *(опционально)* |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram-бота *(опционально)* |
| `TELEGRAM_BOT_USERNAME` | Имя пользователя бота *(опционально)* |
| `CRON_SECRET` | Защита эндпоинта `/api/cron/daily` *(опционально)* |
| `OCR_SPACE_API_KEY` | Ключ OCR.space для распознавания чеков *(опционально)* |

## 🚀 Запуск

```bash
# 1. Зависимости
npm install

# 2. Настройки окружения
cp .env.example .env      # заполни DATABASE_URL и AUTH_SECRET

# 3. Схема базы
npx prisma migrate dev

# 4. Разработка
npm run dev               # http://localhost:3000
```

Прод-сборка:

```bash
npm run build
npm run start
```

## ☁️ Деплой

Проект развёрнут на **Vercel**: https://doxod-one.vercel.app
База данных — PostgreSQL (managed), переменные окружения задаются в настройках проекта.

## 🧠 Что демонстрирует проект

- **Полный full-stack цикл:** схема БД → API → UI, без «заглушек» на каком-то из слоёв
- **Работа с аутентификацией:** сессии, адаптер к БД, хеширование паролей, защита роутов
- **Интеграции с внешними сервисами:** курсы валют, OCR, Telegram Bot API
- **Осознанная оптимизация:** индексы, агрегаты, пагинация и revalidation вместо «сначала работает — потом посмотрим»
- **Строгая типизация и валидация:** TypeScript + Zod на границах приложения

## 🔮 Планы развития

- Экспорт отчётов (PDF / CSV)
- Бюджеты и лимиты по категориям
- Повторяющиеся операции по расписанию
- Тесты на Jest / Vitest

## 👤 Автор

Иван Соломин — [github.com/Districkov](https://github.com/Districkov)
