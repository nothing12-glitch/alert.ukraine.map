export type Language = 'uk' | 'en' | 'pl'

export const languageOptions: { code: Language; label: string; name: string }[] = [
  { code: 'uk', label: 'UA', name: 'Українська' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'pl', label: 'PL', name: 'Polski' },
]

const locales: Record<Language, string> = { uk: 'uk-UA', en: 'en-GB', pl: 'pl-PL' }

const messages = {
  'app.title': {
    uk: 'Повітряна мапа України',
    en: 'Air alert map of Ukraine',
    pl: 'Mapa alarmów powietrznych Ukrainy',
  },
  'brand.aria': {
    uk: 'Повітряна мапа України',
    en: 'Air alert map of Ukraine',
    pl: 'Mapa alarmów powietrznych Ukrainy',
  },
  'brand.title': {
    uk: 'ПОВІТРЯНА МАПА',
    en: 'AIR ALERT MAP',
    pl: 'MAPA ALARMÓW POWIETRZNYCH',
  },
  'brand.subtitle': {
    uk: 'УКРАЇНА · LIVE',
    en: 'UKRAINE · LIVE',
    pl: 'UKRAINA · LIVE',
  },
  'lang.aria': {
    uk: 'Мова інтерфейсу',
    en: 'Interface language',
    pl: 'Język interfejsu',
  },

  'conn.official': { uk: 'ОФІЦІЙНИЙ PUSH', en: 'OFFICIAL PUSH', pl: 'OFICJALNY PUSH' },
  'conn.needsBackend': { uk: 'BACKEND НЕ НАЛАШТОВАНИЙ', en: 'BACKEND NOT CONFIGURED', pl: 'BACKEND NIESKONFIGUROWANY' },
  'conn.polling': { uk: 'ДАНІ ОНОВЛЮЮТЬСЯ', en: 'DATA REFRESHING', pl: 'DANE ODŚWIEŻANE' },
  'conn.stream': { uk: 'ПОТІК NEPTUN', en: 'NEPTUN STREAM', pl: 'STRUMIEŃ NEPTUN' },
  'conn.reconnecting': { uk: 'ПЕРЕПІДКЛЮЧЕННЯ', en: 'RECONNECTING', pl: 'PONOWNE ŁĄCZENIE' },
  'conn.offline': { uk: 'НЕМАЄ ЗВ’ЯЗКУ', en: 'NO CONNECTION', pl: 'BRAK POŁĄCZENIA' },
  'conn.connecting': { uk: 'З’ЄДНАННЯ', en: 'CONNECTING', pl: 'ŁĄCZENIE' },

  'banner.red': { uk: 'ЧЕРВОНИЙ РІВЕНЬ ЗАГРОЗИ', en: 'RED THREAT LEVEL', pl: 'CZERWONY POZIOM ZAGROŻENIA' },
  'banner.yellow': { uk: 'ЖОВТИЙ РІВЕНЬ ЗАГРОЗИ', en: 'YELLOW THREAT LEVEL', pl: 'ŻÓŁTY POZIOM ZAGROŻENIA' },
  'banner.country': { uk: 'СТАН ПО ВСІЙ КРАЇНІ', en: 'COUNTRY-WIDE STATUS', pl: 'SYTUACJA W CAŁYM KRAJU' },
  'banner.received': { uk: 'ОТРИМАНО {time}', en: 'RECEIVED {time}', pl: 'OTRZYMANO {time}' },
  'banner.waiting': { uk: 'очікування даних', en: 'waiting for data', pl: 'oczekiwanie na dane' },
  'banner.stream': { uk: 'ПОТІК ВІД ДЖЕРЕЛА', en: 'STREAMING FROM SOURCE', pl: 'STRUMIEŃ ZE ŹRÓDŁA' },
  'banner.refresh': { uk: 'Оновити дані', en: 'Refresh data', pl: 'Odśwież dane' },

  'headline.official': {
    uk: 'Офіційна карта працює в режимі наживо',
    en: 'The official map is running live',
    pl: 'Oficjalna mapa działa na żywo',
  },
  'headline.needsBackend': {
    uk: 'Підключіть backend для даних нашої мапи',
    en: 'Connect a backend to load our map data',
    pl: 'Podłącz backend, aby wczytać dane naszej mapy',
  },
  'headline.connectingStream': {
    uk: 'Підключаємось до потоку NEPTUN',
    en: 'Connecting to the NEPTUN stream',
    pl: 'Łączenie ze strumieniem NEPTUN',
  },
  'headline.syncing': {
    uk: 'Синхронізуємо поточний стан',
    en: 'Syncing the current status',
    pl: 'Synchronizacja bieżącego stanu',
  },
  'headline.streamInterrupted': {
    uk: 'Потік розірвано, триває перепідключення',
    en: 'Stream interrupted, reconnecting',
    pl: 'Strumień przerwany, ponowne łączenie',
  },
  'headline.streamFailed': {
    uk: 'Не вдалося підключитися до потоку NEPTUN',
    en: 'Could not connect to the NEPTUN stream',
    pl: 'Nie udało się połączyć ze strumieniem NEPTUN',
  },
  'headline.noConnection': {
    uk: 'Немає зв’язку з джерелом',
    en: 'No connection to the source',
    pl: 'Brak połączenia ze źródłem',
  },
  'headline.fetchFailed': {
    uk: 'Не вдалося отримати дані',
    en: 'Failed to fetch data',
    pl: 'Nie udało się pobrać danych',
  },
  'headline.red': {
    uk: 'Червоний рівень загрози у {count} {regions}',
    en: 'Red threat level in {count} {regions}',
    pl: 'Czerwony poziom zagrożenia w {count} {regions}',
  },
  'headline.yellow': {
    uk: 'Жовтий рівень загрози у {count} {regions}',
    en: 'Yellow threat level in {count} {regions}',
    pl: 'Żółty poziom zagrożenia w {count} {regions}',
  },
  'headline.none': {
    uk: 'Активних загроз не зафіксовано',
    en: 'No active threats recorded',
    pl: 'Nie odnotowano aktywnych zagrożeń',
  },

  'mode.aria': { uk: 'Режим оновлення карти', en: 'Map update mode', pl: 'Tryb aktualizacji mapy' },
  'mode.eyebrow': { uk: 'РЕЖИМ ОНОВЛЕННЯ', en: 'UPDATE MODE', pl: 'TRYB AKTUALIZACJI' },
  'mode.official': {
    uk: 'Офіційна мапа з push-оновленнями',
    en: 'Official map with push updates',
    pl: 'Oficjalna mapa z aktualizacjami push',
  },
  'mode.stream': {
    uk: 'Миттєва підписка на потік NEPTUN без нашого backend',
    en: 'Instant NEPTUN stream subscription without our backend',
    pl: 'Natychmiastowa subskrypcja strumienia NEPTUN bez naszego backendu',
  },
  'mode.polling': {
    uk: 'Автоматична перевірка кожні 20 секунд',
    en: 'Automatic refresh every 20 seconds',
    pl: 'Automatyczne odświeżanie co 20 sekund',
  },
  'mode.needsBackend': {
    uk: 'Для власної мапи потрібен backend',
    en: 'Our map needs a backend',
    pl: 'Nasza mapa wymaga backendu',
  },
  'mode.instant': { uk: 'Миттєво', en: 'Instant', pl: 'Natychmiast' },
  'mode.20s': { uk: '20 сек', en: '20 sec', pl: '20 s' },
  'mode.live': { uk: 'Наживо', en: 'Live', pl: 'Na żywo' },
  'mode.instantHint': {
    uk: 'Слухати потік NEPTUN: рівні тривог з’являються за кілька секунд',
    en: 'Listen to the NEPTUN stream: alert levels arrive within seconds',
    pl: 'Słuchaj strumienia NEPTUN: poziomy alarmów pojawiają się w ciągu kilku sekund',
  },
  'mode.pollingHint': {
    uk: 'Оновлювати через backend кожні 20 секунд',
    en: 'Refresh through the backend every 20 seconds',
    pl: 'Odświeżaj przez backend co 20 sekund',
  },
  'mode.pollingUnavailableHint': {
    uk: 'Показати нашу карту; оновлення запрацює після налаштування backend',
    en: 'Show our map; updates will work after the backend is configured',
    pl: 'Pokaż naszą mapę; aktualizacje zadziałają po skonfigurowaniu backendu',
  },
  'mode.liveHint': {
    uk: 'Показати офіційну мапу з live-підпискою',
    en: 'Show the official map with a live subscription',
    pl: 'Pokaż oficjalną mapę z subskrypcją na żywo',
  },
  'mode.backendNotice': {
    uk: 'Цей режим оновлює дані через наш backend: розгорніть його на Render, додайте `ALERTS_IN_UA_TOKEN` у Render Secrets і вкажіть URL сервісу в GitHub variable `ALERTS_API_URL`. Без backend лишіться режиму «Миттєво».',
    en: 'This mode refreshes data through our backend: deploy it on Render, add `ALERTS_IN_UA_TOKEN` to Render Secrets and set the service URL in the GitHub variable `ALERTS_API_URL`. Without a backend, stay in Instant mode.',
    pl: 'Ten tryb odświeża dane przez nasz backend: wdróż go na Render, dodaj `ALERTS_IN_UA_TOKEN` do Render Secrets i ustaw URL usługi w zmiennej GitHub `ALERTS_API_URL`. Bez backendu pozostań w trybie Natychmiast.',
  },

  'stale.withData': {
    uk: 'Показано останні отримані дані станом на {time}.',
    en: 'Showing the last received data as of {time}.',
    pl: 'Pokazano ostatnie otrzymane dane na {time}.',
  },
  'stale.stream': {
    uk: 'Потік NEPTUN недоступний: спробуйте режим «20 сек» або перевірте пізніше.',
    en: 'The NEPTUN stream is unavailable: try 20 sec mode or check again later.',
    pl: 'Strumień NEPTUN jest niedostępny: spróbuj trybu 20 s lub sprawdź później.',
  },
  'stale.polling': {
    uk: 'Перевірте з’єднання та спробуйте оновити дані.',
    en: 'Check your connection and try refreshing the data.',
    pl: 'Sprawdź połączenie i spróbuj odświeżyć dane.',
  },
  'stale.retry': { uk: 'Повторити', en: 'Retry', pl: 'Spróbuj ponownie' },

  'live.aria': { uk: 'Офіційна мапа наживо', en: 'Official live map', pl: 'Oficjalna mapa na żywo' },
  'live.eyebrow': {
    uk: 'ПРЯМА ПІДПИСКА ДЖЕРЕЛА',
    en: 'DIRECT SOURCE SUBSCRIPTION',
    pl: 'BEZPOŚREDNIA SUBSKRYPCJA ŹRÓDŁA',
  },
  'live.title': {
    uk: 'Офіційна карта повітряних тривог',
    en: 'Official air alert map',
    pl: 'Oficjalna mapa alarmów powietrznych',
  },
  'live.open': { uk: 'Відкрити окремо', en: 'Open separately', pl: 'Otwórz osobno' },
  'live.frame': {
    uk: 'Офіційна карта повітряних тривог України наживо',
    en: 'Official air alert map of Ukraine, live',
    pl: 'Oficjalna mapa alarmów powietrznych Ukrainy na żywo',
  },

  'map.eyebrow': {
    uk: 'МОНІТОРИНГ У РЕАЛЬНОМУ ЧАСІ',
    en: 'REAL-TIME MONITORING',
    pl: 'MONITORING W CZASIE RZECZYWISTYM',
  },
  'map.title': { uk: 'Карта областей', en: 'Map of oblasts', pl: 'Mapa obwodów' },
  'regions.count': { uk: '{count} {regions}', en: '{count} {regions}', pl: '{count} {regions}' },
  'map.aria': {
    uk: 'Інтерактивна карта повітряних тривог України',
    en: 'Interactive air alert map of Ukraine',
    pl: 'Interaktywna mapa alarmów powietrznych Ukrainy',
  },
  'map.zoomIn': { uk: 'Збільшити масштаб', en: 'Zoom in', pl: 'Powiększ' },
  'map.zoomAria': { uk: 'Масштаб карти', en: 'Map zoom', pl: 'Skala mapy' },
  'map.zoomOut': { uk: 'Зменшити масштаб', en: 'Zoom out', pl: 'Pomniejsz' },
  'map.zoomReset': { uk: 'Показати всю карту', en: 'Show the whole map', pl: 'Pokaż całą mapę' },
  'map.zoomInHint': {
    uk: 'Збільшити (колесо миші вгору)',
    en: 'Zoom in (mouse wheel up)',
    pl: 'Powiększ (kółko myszy w górę)',
  },
  'map.zoomOutHint': {
    uk: 'Зменшити (колесо миші вниз)',
    en: 'Zoom out (mouse wheel down)',
    pl: 'Pomniejsz (kółko myszy w dół)',
  },
  'map.statsAria': {
    uk: 'Статистика активних загроз',
    en: 'Active threat statistics',
    pl: 'Statystyki aktywnych zagrożeń',
  },
  'map.current': { uk: 'ПОТОЧНИХ', en: 'CURRENT', pl: 'BIEŻĄCE' },
  'map.red': { uk: 'ЧЕРВОНИХ', en: 'RED', pl: 'CZERWONE' },
  'map.yellow': { uk: 'ЖОВТИХ', en: 'YELLOW', pl: 'ŻÓŁTE' },

  'filter.typeAria': {
    uk: 'Фільтр за типом загрози',
    en: 'Filter by threat type',
    pl: 'Filtr według typu zagrożenia',
  },
  'filter.all': { uk: 'Усі', en: 'All', pl: 'Wszystkie' },
  'filter.air': { uk: 'Повітряні', en: 'Air', pl: 'Powietrzne' },
  'filter.other': { uk: 'Інші', en: 'Other', pl: 'Inne' },

  'legend.aria': { uk: 'Умовні позначення', en: 'Legend', pl: 'Legenda' },
  'legend.nominal': { uk: 'Тривала позначка', en: 'Administrative marker', pl: 'Oznaczenie administracyjne' },
  'legend.clear': { uk: 'Не вказано джерелом', en: 'Not reported by source', pl: 'Nie wskazano w źródle' },
  'legend.loading': { uk: 'Завантаження', en: 'Loading', pl: 'Ładowanie' },
  'legend.noData': { uk: 'Немає даних', en: 'No data', pl: 'Brak danych' },

  'caveat': {
    uk: 'Мапа показує записи джерела, які можуть відставати від офіційних сповіщень; відсутність позначки не гарантує безпеки.',
    en: 'The map shows source records that may lag behind official alerts; a missing marker does not guarantee safety.',
    pl: 'Mapa pokazuje zapisy źródła, które mogą być opóźnione względem oficjalnych ostrzeżeń; brak oznaczenia nie gwarantuje bezpieczeństwa.',
  },

  'selected.more': {
    uk: 'і ще {count} у цій області',
    en: 'and {count} more in this region',
    pl: 'i jeszcze {count} w tym obwodzie',
  },
  'selected.markerPrefix': {
    uk: 'Тривала позначка · ',
    en: 'Administrative marker · ',
    pl: 'Oznaczenie administracyjne · ',
  },
  'selected.addFav': { uk: 'Додати до обраного', en: 'Add to favorites', pl: 'Dodaj do ulubionych' },
  'selected.removeFav': { uk: 'Вилучити з обраного', en: 'Remove from favorites', pl: 'Usuń z ulubionych' },
  'selected.clear': { uk: 'Зняти вибір області', en: 'Clear region selection', pl: 'Wyczyść wybór obwodu' },

  'panel.eyebrow': { uk: 'ПЕРЕЛІК', en: 'LIST', pl: 'LISTA' },
  'panel.title': { uk: 'Регіони', en: 'Regions', pl: 'Regiony' },
  'panel.search': { uk: 'Знайти область', en: 'Search region', pl: 'Szukaj obwodu' },
  'panel.filterAll': { uk: 'Усі', en: 'All', pl: 'Wszystkie' },
  'panel.filterActive': { uk: 'Зі статусом', en: 'With status', pl: 'Ze statusem' },
  'panel.favorites': { uk: 'Обрані', en: 'Favorites', pl: 'Ulubione' },
  'panel.filterAria': { uk: 'Фільтр регіонів', en: 'Region filter', pl: 'Filtr obwodów' },
  'panel.notifyAria': { uk: 'Налаштування сповіщень', en: 'Notification settings', pl: 'Ustawienia powiadomień' },
  'panel.notifications': { uk: 'Сповіщення', en: 'Notifications', pl: 'Powiadomienia' },
  'panel.notificationsOn': {
    uk: 'Сповіщення увімкнено',
    en: 'Notifications on',
    pl: 'Powiadomienia włączone',
  },
  'panel.notificationsOffHint': { uk: 'Увімкнути сповіщення', en: 'Enable notifications', pl: 'Włącz powiadomienia' },
  'panel.notificationsOnHint': { uk: 'Вимкнути сповіщення', en: 'Disable notifications', pl: 'Wyłącz powiadomienia' },
  'panel.csvHint': {
    uk: 'Експортувати відфільтровані загрози у CSV',
    en: 'Export filtered threats to CSV',
    pl: 'Eksportuj przefiltrowane zagrożenia do CSV',
  },
  'panel.favOnly': { uk: 'Лише обрані ({count})', en: 'Favorites only ({count})', pl: 'Tylko ulubione ({count})' },
  'panel.favOnlyHint': {
    uk: 'Реагувати лише на загрози в обраних регіонах',
    en: 'React only to threats in favorite regions',
    pl: 'Reaguj tylko na zagrożenia w ulubionych obwodach',
  },
  'panel.sound': { uk: 'Звук', en: 'Sound', pl: 'Dźwięk' },
  'panel.soundHint': {
    uk: 'Звук і вібрація при новій загрозі',
    en: 'Sound and vibration on a new threat',
    pl: 'Dźwięk i wibracja przy nowym zagrożeniu',
  },
  'panel.notifyHint': {
    uk: 'Немає обраних регіонів, тож сповіщень не буде. Виберіть область на мапі й позначте зірочкою.',
    en: 'No favorite regions, so there will be no notifications. Pick a region on the map and mark it with a star.',
    pl: 'Brak ulubionych obwodów, więc nie będzie powiadomień. Wybierz obwód na mapie i oznacz go gwiazdką.',
  },
  'panel.empty': { uk: 'Область не знайдена', en: 'No region found', pl: 'Nie znaleziono obwodu' },
  'panel.standing': {
    uk: 'Тривалі адміністративні позначки на окупованих територіях ({count}) показуються окремо від поточних загроз',
    en: 'Long-standing administrative markers in occupied territories ({count}) are shown separately from current threats',
    pl: 'Długotrwałe oznaczenia administracyjne na okupowanych terytoriach ({count}) są pokazywane osobno od bieżących zagrożeń',
  },
  'panel.source': { uk: 'Джерело: {source}', en: 'Source: {source}', pl: 'Źródło: {source}' },
  'panel.log': { uk: 'Журнал змін', en: 'Change log', pl: 'Dziennik zmian' },
  'panel.logNew': { uk: 'Нова загроза', en: 'New alert', pl: 'Nowy alarm' },
  'panel.logEnded': { uk: 'Загрозу знято', en: 'Alert cleared', pl: 'Alarm odwołany' },
  'panel.logEmpty': {
    uk: 'Зміни з’являться після наступного оновлення джерела.',
    en: 'Changes will appear after the next source refresh.',
    pl: 'Zmiany pojawią się po następnej aktualizacji źródła.',
  },

  'level.red': { uk: 'Червона тривога', en: 'Red alert', pl: 'Czerwony alarm' },
  'level.yellow': { uk: 'Жовта тривога', en: 'Yellow alert', pl: 'Żółty alarm' },
  'levelWord.red': { uk: 'червоний', en: 'red', pl: 'czerwony' },
  'levelWord.yellow': { uk: 'жовтий', en: 'yellow', pl: 'żółty' },
  'level.word': { uk: 'рівень', en: 'level', pl: 'poziom' },

  'status.active': { uk: 'Є тривога або загроза', en: 'Alert or threat active', pl: 'Alarm lub zagrożenie aktywne' },
  'status.nominal': {
    uk: 'Тривала адміністративна позначка',
    en: 'Long-standing administrative marker',
    pl: 'Długotrwałe oznaczenie administracyjne',
  },
  'status.clear': { uk: 'У джерелі не зазначено', en: 'Not reported by source', pl: 'Nie wskazano w źródle' },
  'status.unknown': { uk: 'Немає даних', en: 'No data', pl: 'Brak danych' },

  'alertType.air': { uk: 'Повітряна тривога', en: 'Air alert', pl: 'Alarm powietrzny' },
  'alertType.artillery': {
    uk: 'Загроза артобстрілу',
    en: 'Artillery shelling threat',
    pl: 'Zagrożenie ostrzałem artyleryjskim',
  },
  'alertType.urban': { uk: 'Вуличні бої', en: 'Street fighting', pl: 'Walki uliczne' },
  'alertType.chemical': { uk: 'Хімічна загроза', en: 'Chemical threat', pl: 'Zagrożenie chemiczne' },
  'alertType.nuclear': { uk: 'Радіаційна небезпека', en: 'Radiation hazard', pl: 'Zagrożenie radiacyjne' },
  'alertType.other': { uk: 'Інша загроза', en: 'Other threat', pl: 'Inne zagrożenie' },

  'notify.newCount': { uk: 'Нових загроз: {count}', en: 'New threats: {count}', pl: 'Nowe zagrożenia: {count}' },
  'notify.threat': { uk: 'Загроза: {location}', en: 'Threat: {location}', pl: 'Zagrożenie: {location}' },
  'notify.summary': { uk: '{location}: {type} · {level}', en: '{location}: {type} · {level}', pl: '{location}: {type} · {level}' },
  'notify.more': {
    uk: 'і ще {count} — відкрийте мапу',
    en: 'and {count} more — open the map',
    pl: 'i jeszcze {count} — otwórz mapę',
  },

  'csv.location': { uk: 'Місце', en: 'Location', pl: 'Miejsce' },
  'csv.threat': { uk: 'Загроза', en: 'Threat', pl: 'Zagrożenie' },
  'csv.level': { uk: 'Рівень', en: 'Level', pl: 'Poziom' },
  'csv.started': { uk: 'Початок за джерелом', en: 'Started (source)', pl: 'Początek (źródło)' },
  'csv.duration': { uk: 'Тривалість за джерелом', en: 'Duration (source)', pl: 'Czas trwania (źródło)' },

  'footer.disclaimer': {
    uk: 'Це інформаційна мапа, не офіційне сповіщення. У разі тривоги дотримуйтеся вказівок місцевої влади та прямуйте в укриття.',
    en: 'This is an informational map, not an official alert. During an alert, follow local authorities’ instructions and go to a shelter.',
    pl: 'To mapa informacyjna, a nie oficjalne ostrzeżenie. W razie alarmu postępuj zgodnie z poleceniami władz lokalnych i udaj się do schronu.',
  },
  'footer.borders': { uk: 'Межі:', en: 'Borders:', pl: 'Granice:' },
  'footer.data': { uk: 'Дані:', en: 'Data:', pl: 'Dane:' },
  'footer.neptunSource': {
    uk: 'Карта повітряних тривог — NEPTUN',
    en: 'Air alert map — NEPTUN',
    pl: 'Mapa alarmów powietrznych — NEPTUN',
  },
} as const satisfies Record<string, Record<Language, string>>

export type MessageKey = keyof typeof messages

export function translate(lang: Language, key: MessageKey, params?: Record<string, string | number>) {
  let text: string = messages[key][lang]
  if (params) {
    for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value))
  }
  return text
}

const pluralRules: Record<Language, Intl.PluralRules> = {
  uk: new Intl.PluralRules('uk-UA'),
  en: new Intl.PluralRules('en-GB'),
  pl: new Intl.PluralRules('pl-PL'),
}

const regionWords: Record<Language, { nominative: [string, string, string]; locative: [string, string, string] }> = {
  uk: {
    nominative: ['регіон', 'регіони', 'регіонів'],
    locative: ['регіоні', 'регіонах', 'регіонах'],
  },
  en: {
    nominative: ['region', 'regions', 'regions'],
    locative: ['region', 'regions', 'regions'],
  },
  pl: {
    nominative: ['region', 'regiony', 'regionów'],
    locative: ['regionie', 'regionach', 'regionach'],
  },
}

export function regionWord(lang: Language, count: number, form: 'nominative' | 'locative' = 'nominative') {
  const category = pluralRules[lang].select(count)
  const index = category === 'one' ? 0 : category === 'few' ? 1 : 2
  return regionWords[lang][form][index]
}

const regionTitlesEn: Record<string, string> = {
  cherkasy: 'Cherkasy Oblast',
  chernihiv: 'Chernihiv Oblast',
  chernivtsi: 'Chernivtsi Oblast',
  crimea: 'Autonomous Republic of Crimea',
  dnipropetrovsk: 'Dnipropetrovsk Oblast',
  donetsk: 'Donetsk Oblast',
  'ivano-frankivsk': 'Ivano-Frankivsk Oblast',
  kharkiv: 'Kharkiv Oblast',
  kherson: 'Kherson Oblast',
  khmelnytskyi: 'Khmelnytskyi Oblast',
  kirovohrad: 'Kirovohrad Oblast',
  kyiv: 'Kyiv Oblast',
  'kyiv-city': 'Kyiv city',
  luhansk: 'Luhansk Oblast',
  lviv: 'Lviv Oblast',
  mykolaiv: 'Mykolaiv Oblast',
  odessa: 'Odesa Oblast',
  poltava: 'Poltava Oblast',
  rivne: 'Rivne Oblast',
  sumy: 'Sumy Oblast',
  ternopil: 'Ternopil Oblast',
  vinnytsia: 'Vinnytsia Oblast',
  volyn: 'Volyn Oblast',
  zakarpattia: 'Zakarpattia Oblast',
  zaporizhia: 'Zaporizhzhia Oblast',
  zhytomyr: 'Zhytomyr Oblast',
}

const regionTitlesPl: Record<string, string> = {
  cherkasy: 'Obwód czerkaski',
  chernihiv: 'Obwód czernihowski',
  chernivtsi: 'Obwód czerniowiecki',
  crimea: 'Autonomiczna Republika Krymu',
  dnipropetrovsk: 'Obwód dniepropetrowski',
  donetsk: 'Obwód doniecki',
  'ivano-frankivsk': 'Obwód iwanofrankiwski',
  kharkiv: 'Obwód charkowski',
  kherson: 'Obwód chersoński',
  khmelnytskyi: 'Obwód chmielnicki',
  kirovohrad: 'Obwód kirowohradzki',
  kyiv: 'Obwód kijowski',
  'kyiv-city': 'Miasto Kijów',
  luhansk: 'Obwód ługański',
  lviv: 'Obwód lwowski',
  mykolaiv: 'Obwód mikołajowski',
  odessa: 'Obwód odeski',
  poltava: 'Obwód połtawski',
  rivne: 'Obwód rówieński',
  sumy: 'Obwód sumski',
  ternopil: 'Obwód tarnopolski',
  vinnytsia: 'Obwód winnicki',
  volyn: 'Obwód wołyński',
  zakarpattia: 'Obwód zakarpacki',
  zaporizhia: 'Obwód zaporoski',
  zhytomyr: 'Obwód żytomierski',
}

export function regionTitle(lang: Language, regionId: string, fallback: string) {
  if (lang === 'en') return regionTitlesEn[regionId] ?? fallback
  if (lang === 'pl') return regionTitlesPl[regionId] ?? fallback
  return fallback
}

const alertTypeKeys: Record<string, MessageKey> = {
  'Повітряна тривога': 'alertType.air',
  'Загроза артобстрілу': 'alertType.artillery',
  'Вуличні бої': 'alertType.urban',
  'Хімічна загроза': 'alertType.chemical',
  'Радіаційна небезпека': 'alertType.nuclear',
  'Інша загроза': 'alertType.other',
}

export function alertTypeLabel(lang: Language, type: string) {
  const key = alertTypeKeys[type.trim()]
  return key ? translate(lang, key) : type
}

export function formatDateTime(lang: Language, iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.valueOf())) return ''
  return new Intl.DateTimeFormat(locales[lang], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Kyiv',
  }).format(date)
}

export function formatClock(lang: Language, iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.valueOf())) return ''
  return new Intl.DateTimeFormat(locales[lang], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Kyiv',
  }).format(date)
}

const durationUnits: Record<Language, { day: string; hour: string; minute: string }> = {
  uk: { day: 'д', hour: 'год', minute: 'хв' },
  en: { day: 'd', hour: 'h', minute: 'min' },
  pl: { day: 'd', hour: 'godz.', minute: 'min' },
}

export function formatDuration(lang: Language, iso: string) {
  const startedAt = new Date(iso).getTime()
  if (!Number.isFinite(startedAt)) return ''

  const units = durationUnits[lang]
  const minutes = Math.max(0, Math.floor((Date.now() - startedAt) / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const rest = minutes % 60
  const parts: string[] = []
  if (days) parts.push(`${days} ${units.day}`)
  if (hours) parts.push(`${hours} ${units.hour}`)
  if (rest || parts.length === 0) parts.push(`${rest} ${units.minute}`)
  return parts.join(' ')
}

