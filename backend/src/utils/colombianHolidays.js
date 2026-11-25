'use strict';

/**
 * Calendario Oficial de Festivos de Colombia (Ley 51 de 1983 - Ley Emiliani)
 * + Sincronización opcional con Nager.Date Public Holidays API
 * + Regla oficial de Pico y Placa Bogotá (Decreto 003/2023 SDM).
 */

const holidayCache = new Map();

function formatYMD(year, month1Based, day) {
  return `${year}-${String(month1Based).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Algoritmo de Butcher-Meeus para Domingo de Pascua
function computeEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=Marzo, 4=Abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function addDaysUTC(date, days) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// Ley Emiliani: si no cae lunes, trasladar al siguiente lunes
function moveToNextMondayUTC(date) {
  const dow = date.getUTCDay(); // 0=Dom, 1=Lun, ...
  if (dow === 1) return date;
  const delta = dow === 0 ? 1 : 8 - dow;
  return addDaysUTC(date, delta);
}

function toYMDFromUTC(date) {
  return formatYMD(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function computeColombianHolidaysLocal(year) {
  const y = Number(year) || new Date().getFullYear();
  const easter = computeEasterSunday(y);

  const fixed = [
    { date: formatYMD(y, 1, 1), name: 'Año Nuevo' },
    { date: formatYMD(y, 5, 1), name: 'Día del Trabajo' },
    { date: formatYMD(y, 7, 20), name: 'Día de la Independencia' },
    { date: formatYMD(y, 8, 7), name: 'Batalla de Boyacá' },
    { date: formatYMD(y, 12, 8), name: 'Inmaculada Concepción' },
    { date: formatYMD(y, 12, 25), name: 'Navidad' },
  ];

  const emilianiFixed = [
    { m: 1, d: 6, name: 'Día de los Reyes Magos' },
    { m: 3, d: 19, name: 'Día de San José' },
    { m: 6, d: 29, name: 'San Pedro y San Pablo' },
    { m: 8, d: 15, name: 'Asunción de la Virgen' },
    { m: 10, d: 12, name: 'Día de la Raza' },
    { m: 11, d: 1, name: 'Todos los Santos' },
    { m: 11, d: 11, name: 'Independencia de Cartagena' },
  ].map((h) => ({
    date: toYMDFromUTC(moveToNextMondayUTC(new Date(Date.UTC(y, h.m - 1, h.d, 12, 0, 0)))),
    name: h.name,
  }));

  const easterRelative = [
    { date: toYMDFromUTC(addDaysUTC(easter, -3)), name: 'Jueves Santo' },
    { date: toYMDFromUTC(addDaysUTC(easter, -2)), name: 'Viernes Santo' },
    { date: toYMDFromUTC(moveToNextMondayUTC(addDaysUTC(easter, 39))), name: 'Ascensión del Señor' },
    { date: toYMDFromUTC(moveToNextMondayUTC(addDaysUTC(easter, 60))), name: 'Corpus Christi' },
    { date: toYMDFromUTC(moveToNextMondayUTC(addDaysUTC(easter, 68))), name: 'Sagrado Corazón de Jesús' },
  ];

  const all = [...fixed, ...emilianiFixed, ...easterRelative].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  return all;
}

async function getColombianHolidays(year = new Date().getFullYear()) {
  const y = Number(year) || new Date().getFullYear();
  const cached = holidayCache.get(y);
  if (cached && Date.now() - cached.fetchedAt < 24 * 3600 * 1000) {
    return cached.items;
  }

  const localItems = computeColombianHolidaysLocal(y);

  if (process.env.NODE_ENV !== 'test') {
    try {
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/CO`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const external = await res.json();
        if (Array.isArray(external) && external.length >= 15) {
          const mapped = external.map((h) => ({
            date: h.date,
            name: h.localName || h.name,
            source: 'nager.date',
          }));
          holidayCache.set(y, { items: mapped, fetchedAt: Date.now() });
          return mapped;
        }
      }
    } catch {
      // Fallback silencioso al motor local Ley Emiliani
    }
  }

  const withSource = localItems.map((h) => ({ ...h, source: 'ley_emiliani_local' }));
  holidayCache.set(y, { items: withSource, fetchedAt: Date.now() });
  return withSource;
}

function getBogotaDateParts(inputDate = new Date()) {
  const d = inputDate instanceof Date ? inputDate : new Date(inputDate);
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = fmt.formatToParts(d);
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  const ymd = `${map.year}-${map.month}-${map.day}`;
  const localNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dow = localNoon.getUTCDay(); // 0=Dom .. 6=Sab
  return { year, month, day, ymd, dow };
}

function isHolidaySync(ymd) {
  const year = Number(String(ymd).slice(0, 4));
  const list = holidayCache.get(year)?.items || computeColombianHolidaysLocal(year);
  return list.find((h) => h.date === ymd) || null;
}

/**
 * Calcula N días hábiles en Colombia (excluyendo sábados, domingos y los 18 festivos de Ley Emiliani).
 */
function calcularDiasHabilesColombia(fechaInicio = new Date(), diasHabiles = 15) {
  const fecha = new Date(fechaInicio);
  let agregados = 0;

  while (agregados < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1);
    const dow = fecha.getDay();
    if (dow === 0 || dow === 6) continue;
    const ymd = formatYMD(fecha.getFullYear(), fecha.getMonth() + 1, fecha.getDate());
    if (isHolidaySync(ymd)) continue;
    agregados++;
  }
  fecha.setHours(23, 59, 59, 999);
  return fecha.toISOString();
}

function calcularPicoYPlacaBogota(inputDate = new Date()) {
  const { day, ymd, dow } = getBogotaDateParts(inputDate);
  const festivo = isHolidaySync(ymd);

  if (dow === 0 || dow === 6 || festivo) {
    const esLunesFestivo = dow === 1 && Boolean(festivo);
    return {
      fecha: ymd,
      aplica: false,
      esFestivo: Boolean(festivo),
      festivoNombre: festivo?.name || null,
      placasHabilitadas: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      placasRestringidas: [],
      horario: 'Sin restricción urbana hoy',
      alertaRegional: esLunesFestivo
        ? 'Pico y Placa Regional ingreso a Bogotá: 12:00 PM - 4:00 PM pares • 4:00 PM - 8:00 PM impares'
        : null,
    };
  }

  const esImpar = day % 2 !== 0;
  return {
    fecha: ymd,
    aplica: true,
    esFestivo: false,
    festivoNombre: null,
    placasHabilitadas: esImpar ? ['1', '2', '3', '4', '5'] : ['6', '7', '8', '9', '0'],
    placasRestringidas: esImpar ? ['6', '7', '8', '9', '0'] : ['1', '2', '3', '4', '5'],
    horario: '06:00 AM - 09:00 PM',
    alertaRegional: null,
  };
}

module.exports = {
  computeColombianHolidaysLocal,
  getColombianHolidays,
  getBogotaDateParts,
  isHolidaySync,
  calcularDiasHabilesColombia,
  calcularPicoYPlacaBogota,
};
