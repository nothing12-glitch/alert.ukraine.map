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
  'conn.polling': { uk: 'ДАНІ ОНОВЛЮЮТЬСЯ', en: 'DATA REFRESHING', pl: 'DANE ODŚWIEŻANE' },
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
  'headline.syncing': {
    uk: 'Синхронізуємо поточний стан',
    en: 'Syncing the current status',
    pl: 'Synchronizacja bieżącego stanu',
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
  'headline.partial': {
    uk: 'Тривога частково у {count} {regions}',
    en: 'Partial alerts in {count} {regions}',
    pl: 'Częściowe alarmy w {count} {regions}',
  },
  'banner.partial': {
    uk: 'Частково: {regions} · {districts}',
    en: 'Partial: {regions} · {districts}',
    pl: 'Częściowo: {regions} · {districts}',
  },
  'banner.partialHint': {
    uk: 'Тривога оголошена лише в окремих районах цих областей',
    en: 'The alert covers only some districts of these regions',
    pl: 'Alarm obejmuje tylko niektóre rejony tych obwodów',
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
  'mode.polling': {
    uk: 'Оновлення через наш backend раз на хвилину',
    en: 'Refreshing through our backend every minute',
    pl: 'Odświeżanie przez nasz backend co minutę',
  },
  'mode.snapshot': {
    uk: 'Оновлення зі знямка офіційного джерела',
    en: 'Refreshing from the official source snapshot',
    pl: 'Odświeżanie z migawki oficjalnego źródła',
  },
  'mode.poll': { uk: 'Автооновлення', en: 'Auto-update', pl: 'Automatycznie' },
  'mode.live': { uk: 'Наживо', en: 'Live', pl: 'Na żywo' },
  'mode.pollingHint': {
    uk: 'Перевіряти дані щохвилини: backend раз на хвилину, знімок джерела — раз на 5 хвилин',
    en: 'Check the data every minute: the backend serves one-minute slices, the source snapshot five-minute ones',
    pl: 'Sprawdzaj dane co minutę: backend daje dane co minutę, migawka źródła co 5 minut',
  },
  'mode.liveHint': {
    uk: 'Показати офіційну мапу з live-підпискою',
    en: 'Show the official map with a live subscription',
    pl: 'Pokaż oficjalną mapę z subskrypcją na żywo',
  },
  'stale.withData': {
    uk: 'Показано останні отримані дані станом на {time}.',
    en: 'Showing the last received data as of {time}.',
    pl: 'Pokazano ostatnie otrzymane dane na {time}.',
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
  'map.partial': { uk: 'ЧАСТКОВИХ', en: 'PARTIAL', pl: 'CZĘŚCIOWE' },
  'map.partialHint': {
    uk: 'Області, де тривога охоплює лише окремі райони',
    en: 'Regions where the alert covers only some districts',
    pl: 'Obwody, w których alarm obejmuje tylko część rejonów',
  },
  'map.regionPartial': {
    uk: '{label} · районів: {count}',
    en: '{label} · districts: {count}',
    pl: '{label} · rejonów: {count}',
  },
  'map.focusHint': {
    uk: 'Наблизити область (подвійний клік)',
    en: 'Zoom to region (double-click)',
    pl: 'Przybliż obwód (podwójne kliknięcie)',
  },

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
  'legend.partial': { uk: 'Часткова (окремі райони)', en: 'Partial (some districts)', pl: 'Częściowy (część rejonów)' },
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
  'selected.raions': {
    uk: 'Тривога в районах ({districts})',
    en: 'Districts under alert ({districts})',
    pl: 'Rejony objęte alarmem ({districts})',
  },
  'selected.raionsHint': {
    uk: 'Область пофарбована частково: тривога лише в цих районах',
    en: 'The region is shaded partially: only these districts are under alert',
    pl: 'Obwód jest częściowo zacieniowany: alarm tylko w tych rejonach',
  },
  'selected.zoom': { uk: 'Наблизити область', en: 'Zoom to region', pl: 'Przybliż obwód' },
  'selected.copy': { uk: 'Копіювати зведення', en: 'Copy summary', pl: 'Kopiuj podsumowanie' },
  'selected.copied': { uk: 'Скопійовано', en: 'Copied', pl: 'Skopiowano' },

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
  'status.partial': {
    uk: 'Часткова тривога (окремі райони)',
    en: 'Partial alert (some districts)',
    pl: 'Częściowy alarm (część rejonów)',
  },
  'status.nominal': {
    uk: 'Тривала адміністративна позначка',
    en: 'Long-standing administrative marker',
    pl: 'Długotrwałe oznaczenie administracyjne',
  },
  'status.clear': { uk: 'У джерелі не зазначено', en: 'Not reported by source', pl: 'Nie wskazano w źródle' },
  'status.cleared': {
    uk: 'Відбій повітряної тривоги',
    en: 'Air raid alert all clear',
    pl: 'Odwołanie alarmu powietrznego',
  },
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

  'theme.aria': { uk: 'Тема оформлення', en: 'Color theme', pl: 'Motyw kolorystyczny' },
  'theme.toDark': { uk: 'Увімкнути темну тему', en: 'Switch to dark theme', pl: 'Włącz ciemny motyw' },
  'theme.toLight': { uk: 'Увімкнути світлу тему', en: 'Switch to light theme', pl: 'Włącz jasny motyw' },

  'toast.new': { uk: 'Нова тривога', en: 'New alert', pl: 'Nowy alarm' },
  'toast.ended': { uk: 'Відбій тривоги', en: 'Alert ended', pl: 'Alarm odwołany' },
  'toast.dismiss': { uk: 'Закрити сповіщення', en: 'Dismiss notification', pl: 'Zamknij powiadomienie' },
  'toast.andMore': { uk: 'і ще {count}', en: 'and {count} more', pl: 'i jeszcze {count}' },

  'panel.copySummary': { uk: 'Копіювати зведення', en: 'Copy summary', pl: 'Kopiuj podsumowanie' },
  'panel.copySummaryHint': {
    uk: 'Скопіювати текстовий огляд активних тривог із посиланням на мапу',
    en: 'Copy a text overview of active alerts with a link to the map',
    pl: 'Kopiuj tekstowe podsumowanie aktywnych alarmów z linkiem do mapy',
  },
  'panel.searchHint': { uk: 'Пошук області (клавіша /)', en: 'Search regions ( / key)', pl: 'Szukaj obwodu (klawisz /)' },
  'panel.clearSearch': { uk: 'Очистити пошук', en: 'Clear search', pl: 'Wyczyść wyszukiwanie' },
  'panel.shortcuts': {
    uk: '+ / − масштаб · 0 вся мапа · / пошук · Esc зняти вибір',
    en: '+ / − zoom · 0 whole map · / search · Esc clear selection',
    pl: '+ / − powiększenie · 0 cała mapa · / szukaj · Esc wyczyść wybór',
  },

  'footer.disclaimer': {
    uk: 'Це інформаційна мапа, не офіційне сповіщення. У разі тривоги дотримуйтеся вказівок місцевої влади та прямуйте в укриття.',
    en: 'This is an informational map, not an official alert. During an alert, follow local authorities’ instructions and go to a shelter.',
    pl: 'To mapa informacyjna, a nie oficjalne ostrzeżenie. W razie alarmu postępuj zgodnie z poleceniami władz lokalnych i udaj się do schronu.',
  },
  'footer.borders': { uk: 'Межі:', en: 'Borders:', pl: 'Granice:' },
  'footer.data': { uk: 'Дані:', en: 'Data:', pl: 'Dane:' },
  'footer.alarmSource': {
    uk: 'Дані тривог — UkraineAlarm',
    en: 'Alert data — UkraineAlarm',
    pl: 'Dane alarmów — UkraineAlarm',
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

const regionWords: Record<Language, { nominative: [string, string, string]; locative: [string, string, string]; genitive: [string, string, string] }> = {
  uk: {
    nominative: ['регіон', 'регіони', 'регіонів'],
    locative: ['регіоні', 'регіонах', 'регіонах'],
    genitive: ['регіону', 'регіонів', 'регіонів'],
  },
  en: {
    nominative: ['region', 'regions', 'regions'],
    locative: ['region', 'regions', 'regions'],
    genitive: ['region', 'regions', 'regions'],
  },
  pl: {
    nominative: ['region', 'regiony', 'regionów'],
    locative: ['regionie', 'regionach', 'regionach'],
    genitive: ['regionu', 'regionów', 'regionów'],
  },
}

const districtWords: Record<Language, [string, string, string]> = {
  uk: ['район', 'райони', 'районів'],
  en: ['district', 'districts', 'districts'],
  pl: ['rejon', 'rejony', 'rejonów'],
}

function pluralIndex(lang: Language, count: number) {
  const category = pluralRules[lang].select(count)
  return category === 'one' ? 0 : category === 'few' ? 1 : 2
}

export function regionWord(lang: Language, count: number, form: 'nominative' | 'locative' | 'genitive' = 'nominative') {
  return regionWords[lang][form][pluralIndex(lang, count)]
}

export function districtWord(lang: Language, count: number) {
  return districtWords[lang][pluralIndex(lang, count)]
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

