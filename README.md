# Повітряна мапа України

Desktop-first інтерактивна карта з актуальними тривогами й іншими загрозами по областях та місту Києву.

## Запуск

```powershell
npm.cmd install
npm.cmd run dev
```

Відкрийте адресу, яку покаже Vite (типово `http://localhost:5173`). Для production-перевірки виконайте `npm.cmd run build`.

## Дані

Для власної карти джерелом є [alerts.in.ua API](https://alerts.in.ua/), якщо на сервері налаштовано `ALERTS_IN_UA_TOKEN`. Backend викликає `/v1/alerts/active.json` із Bearer-токеном, групує записи за `location_oblast` і віддає браузеру тільки нормалізовані поля. Без токена використовується fallback на публічні картки [map.ukrainealarm.com](https://map.ukrainealarm.com/). Токен ніколи не передається frontend. Режим `20 сек` кешує відповіді backend на 20 секунд (до 3 запитів на хвилину). У шапці показаний час отримання даних; при помилці карта зберігає останній успішний стан.

Ключ `alerts.in.ua` запитується окремо через [форму для розробників](https://alerts.in.ua/api-request). Форма `api.ukrainealarm.com` видає ключ іншого сервісу й не підходить для цього API-клієнта.

Є фільтри повітряних тривог та інших загроз, пошук і фільтри регіонів, обране, журнал змін, дозвільні браузерні сповіщення та CSV-експорт. Налаштування й журнал зберігаються локально у браузері. Режим `Наживо` вбудовує офіційну карту, яка використовує власну push-підписку; персональний токен наш frontend не читає і не передає.

Довгі адміністративні позначки Криму й Луганщини (від 14 днів за даними джерела) показуються окремо й не входять до лічильника поточних загроз. Час початку та тривалість відображаються так, як їх надає джерело; ці значення можуть бути приблизними або неузгодженими.

Офіційна карта попереджає, що відображення загроз може бути приблизним і запізнюватися, не охоплює всіх загроз і не призначене для визначення безпеки. Не покладайтеся на цю карту замість офіційних сповіщень: під час тривоги прямуйте в укриття та виконуйте вказівки місцевої влади. Цілі й точні координати в цьому застосунку не показуються.

`npm.cmd run dev` запускає frontend разом із локальним Vite feed proxy. `npm.cmd run start:server` запускає окремий backend на порту 3000. Для production backend використовується `render.yaml`; задайте `ALLOWED_ORIGIN` точним origin GitHub Pages.

## GitHub Pages

1. Створи GitHub repository і push гілку `main`.
2. У GitHub Settings → Pages вибери GitHub Actions як deployment source.
3. У Render створи Blueprint із цього репозиторію за `render.yaml`; задай `ALLOWED_ORIGIN` як `https://<username>.github.io` і `ALERTS_IN_UA_TOKEN` як секретне значення зі свого alerts.in.ua developer key.
4. Скопіюй URL Render service у GitHub repository variable `ALERTS_API_URL`, щоб увімкнути режим `20 сек`, і перезапусти Pages workflow.

Workflow `.github/workflows/pages.yml` публікує frontend після push у `main`. Режим `20 сек` використовує Render backend; режим `Наживо` вбудовує офіційну мапу та не потребує передачі твого токена нашому frontend.

GitHub Pages не запускає Vite middleware і не може напряму читати API через CORS. Без `ALERTS_API_URL` сторінка відкривається в live-режимі, а polling-кнопка вимкнена до розгортання backend. Форма запиту ключа на `api.ukrainealarm.com` і developer API `alerts.in.ua` — різні сервіси; для цього backend потрібен токен саме `alerts.in.ua`.

## Атрибуція карти

Геометрія областей постачається пакетом `@svg-maps/ukraine`, похідним від [MapSVG](https://mapsvg.com/maps/ukraine), за ліцензією [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
