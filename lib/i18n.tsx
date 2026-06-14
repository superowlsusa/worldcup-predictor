'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'es';

type Dict = Record<string, string>;

const en: Dict = {
  'nav.predictions': 'Predictions',
  'nav.standings': 'Standings',
  'nav.rules': 'Rules',
  'nav.admin': 'Admin',
  'nav.signIn': 'Sign in',
  'nav.signOut': 'Sign out',

  'home.badge': 'Lakewood Ranch Adult Soccer Club · Mobile web app',
  'home.title': 'Predict every World Cup score.',
  'home.subtitle': 'Players sign up, make score predictions, and compete on a live league table. Picks lock one hour before kick-off.',

  'footer.addToHome': 'Add this site to your iPhone or Samsung home screen and play like an app.',

  'fx.all': 'All',
  'fx.jumpLive': 'Live game',
  'fx.jumpNext': 'Next game',
  'fx.guestPrefix': 'You’re browsing as a guest.',
  'fx.guestLink': 'Sign in or create an account',
  'fx.guestSuffix': 'to save your predictions.',
  'fx.signInToSaveMsg': 'Please sign in or create an account first — then your prediction will save.',
  'fx.lockedMsg': 'This match is locked. Predictions close one hour before kick-off.',
  'fx.saved': 'Saved',
  'fx.match': 'Match',
  'fx.group': 'Group',
  'fx.yourPick': 'Your pick',
  'fx.final': 'Final',
  'fx.points': 'Points',
  'fx.locked': 'Locked',
  'fx.locksIn': 'Locks in',
  'fx.btnSignInToSave': 'Sign in to save',
  'fx.btnSave': 'Save prediction',
  'fx.btnSaved': '✓ Prediction saved',
  'fx.btnUpdate': 'Update prediction',
  'fx.changeHint': 'You can change your prediction until 1 hour before this stage’s first match.',
  'fx.lockNote': 'Predictions lock 1 hour before this stage’s first match kicks off.',
  'fx.seePicks': 'See everyone’s picks',
  'fx.hidePicks': 'Hide picks',
  'fx.noPicks': 'No predictions were made for this match.',

  'auth.join': 'Join the league',
  'auth.signIn': 'Sign in',
  'auth.blurb': 'Players only need an email, password, and display name. Works from a normal web link.',
  'auth.displayName': 'Display name',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.createAccount': 'Create account',
  'auth.pleaseWait': 'Please wait...',
  'auth.toggleToSignIn': 'Already signed up? Sign in',
  'auth.toggleToJoin': 'Need an account? Join',
  'auth.created': 'Account created. Check your email to confirm your address, then come back and sign in.',
  'auth.alreadyIn': 'You’re signed in and ready to play.',
  'auth.goPredict': 'Go to predictions',
  'auth.pageTitle': 'Sign in or join',

  'st.title': 'League Table',
  'st.refresh': 'Refresh',
  'st.colPlayer': 'Player',
  'st.colExact': 'Exact (3 points)',
  'st.colOutcome': 'Outcome (1 point)',
  'st.colTotal': 'Total Points',
  'st.colPicks': 'Picks',
  'st.empty': 'No predictions yet.',
  'st.search': 'Search players…',
  'st.jumpToMe': 'Jump to me',
  'st.you': 'You',
  'st.noMatch': 'No players match your search.',
  'st.tabGroup': 'Group Stage',
  'st.tabKnockout': 'Knockouts',
  'st.groupTitle': 'Group Stage table',
  'st.knockoutTitle': 'Knockouts table',

  'stp.badge': 'Live standings',
  'stp.title': 'League table',
  'stp.subtitle': 'Two competitions — group stage and knockouts. Switch tables below. Ranked by total points, then exact scores, then correct outcomes.',

  'rules.badge': 'Game rules',
  'rules.title': 'How scoring works',
  'rules.exactTitle': 'Exact score',
  'rules.exactBody': 'Nail the exact final score — including an exact draw like 2-2 — and earn',
  'rules.pts3': '3 points',
  'rules.outcomeTitle': 'Right result, wrong score',
  'rules.outcomeBody': 'Get the result right (the correct winner, or any draw) but not the exact score — e.g. you predict 2-2 and it finishes 1-1 — and earn',
  'rules.pts1': '1 point',
  'rules.lockTitle': 'Lock time',
  'rules.lockBody': 'All predictions for a stage can be added or changed until',
  'rules.oneHour': '1 hour before that stage’s first match',
  'rules.koTitle': 'Knockout rounds',
  'rules.koBody': 'When the knockout matchups are known, the teams are filled in automatically. Players can then make new selections for those fixtures until 1 hour before that round’s first match.',
  'rules.koScoreTitle': 'Knockout scoring',
  'rules.koScoreBody': 'Knockout matches are scored on the score when play ends — not on penalties. A clear winner in normal time (90′) or extra time (120′) counts as that final score. If it’s still tied after extra time and decided by a penalty shootout, it’s scored as a draw — the shootout doesn’t count.',
  'rules.joinTitle': 'How to join',
  'rules.joinBody': 'Two separate competitions — enter either or both. Once you’ve signed up, Zelle your entry to Copo: $30 for the group stage, $50 for the knockouts.',
  'rules.payoutTitle': 'Entry & payouts',
  'rules.payoutGroup': 'Group stage (paid after the group games) — 1st: $800 · 2nd: $250 · 3rd: $150. If players tie, the prize money is split equally between them.',
  'rules.payoutKnockout': 'Knockouts — winner takes the pool, paid after the final. Separate standings table.',

  'admin.badge': 'Admin only',
  'admin.title': 'Update scores & knockout teams',
  'admin.subtitle': 'Save final scores here. The database function recalculates prediction points and the standings automatically.',
  'admin.checking': 'Checking admin access...',
  'admin.signInFirst': 'Sign in first. Then mark your profile as admin in Supabase.',
  'admin.notAdmin': 'You are signed in, but your profile is not marked as admin.',
  'admin.heading': 'Admin',
  'admin.updateTeams': 'Update teams',
  'admin.saveFinal': 'Save final score',
  'admin.filterNeeds': 'Needs result',
  'admin.awaiting': 'Awaiting result',
  'admin.noneToScore': 'No matches are waiting for a result right now.',
  'admin.clearResult': 'Clear result',
  'admin.confirmClear': 'Clear this result and reset its points to 0?',
  'admin.cleared': 'cleared',

  'lang.label': 'Language',
};

const es: Dict = {
  'nav.predictions': 'Predicciones',
  'nav.standings': 'Clasificación',
  'nav.rules': 'Reglas',
  'nav.admin': 'Admin',
  'nav.signIn': 'Iniciar sesión',
  'nav.signOut': 'Cerrar sesión',

  'home.badge': 'Lakewood Ranch Adult Soccer Club · App web móvil',
  'home.title': 'Predice cada resultado del Mundial.',
  'home.subtitle': 'Los jugadores se registran, predicen los marcadores y compiten en una tabla en vivo. Las predicciones se bloquean una hora antes del inicio.',

  'footer.addToHome': 'Añade este sitio a la pantalla de inicio de tu iPhone o Samsung y juega como una app.',

  'fx.all': 'Todos',
  'fx.jumpLive': 'Partido en vivo',
  'fx.jumpNext': 'Próximo partido',
  'fx.guestPrefix': 'Estás navegando como invitado.',
  'fx.guestLink': 'Inicia sesión o crea una cuenta',
  'fx.guestSuffix': 'para guardar tus predicciones.',
  'fx.signInToSaveMsg': 'Primero inicia sesión o crea una cuenta — luego se guardará tu predicción.',
  'fx.lockedMsg': 'Este partido está bloqueado. Las predicciones cierran una hora antes del inicio.',
  'fx.saved': 'Guardado',
  'fx.match': 'Partido',
  'fx.group': 'Grupo',
  'fx.yourPick': 'Tu predicción',
  'fx.final': 'Final',
  'fx.points': 'Puntos',
  'fx.locked': 'Bloqueado',
  'fx.locksIn': 'Cierra en',
  'fx.btnSignInToSave': 'Inicia sesión para guardar',
  'fx.btnSave': 'Guardar predicción',
  'fx.btnSaved': '✓ Predicción guardada',
  'fx.btnUpdate': 'Actualizar predicción',
  'fx.changeHint': 'Puedes cambiar tu predicción hasta 1 hora antes del primer partido de esta fase.',
  'fx.lockNote': 'Las predicciones se cierran 1 hora antes del primer partido de esta fase.',
  'fx.seePicks': 'Ver predicciones de todos',
  'fx.hidePicks': 'Ocultar predicciones',
  'fx.noPicks': 'No se hicieron predicciones para este partido.',

  'auth.join': 'Únete a la liga',
  'auth.signIn': 'Iniciar sesión',
  'auth.blurb': 'Los jugadores solo necesitan correo, contraseña y un nombre para mostrar. Funciona desde un enlace web normal.',
  'auth.displayName': 'Nombre para mostrar',
  'auth.email': 'Correo',
  'auth.password': 'Contraseña',
  'auth.createAccount': 'Crear cuenta',
  'auth.pleaseWait': 'Espera...',
  'auth.toggleToSignIn': '¿Ya tienes cuenta? Inicia sesión',
  'auth.toggleToJoin': '¿Necesitas una cuenta? Únete',
  'auth.created': 'Cuenta creada. Revisa tu correo para confirmar tu dirección, luego vuelve e inicia sesión.',
  'auth.alreadyIn': 'Has iniciado sesión y estás listo para jugar.',
  'auth.goPredict': 'Ir a las predicciones',
  'auth.pageTitle': 'Inicia sesión o únete',

  'st.title': 'Tabla de la liga',
  'st.refresh': 'Actualizar',
  'st.colPlayer': 'Jugador',
  'st.colExact': 'Exactos (3 puntos)',
  'st.colOutcome': 'Resultado (1 punto)',
  'st.colTotal': 'Puntos totales',
  'st.colPicks': 'Predic.',
  'st.empty': 'Aún no hay predicciones.',
  'st.search': 'Buscar jugadores…',
  'st.jumpToMe': 'Ir a mí',
  'st.you': 'Tú',
  'st.noMatch': 'Ningún jugador coincide con tu búsqueda.',
  'st.tabGroup': 'Fase de grupos',
  'st.tabKnockout': 'Eliminatorias',
  'st.groupTitle': 'Tabla de fase de grupos',
  'st.knockoutTitle': 'Tabla de eliminatorias',

  'stp.badge': 'Clasificación en vivo',
  'stp.title': 'Tabla de la liga',
  'stp.subtitle': 'Dos competiciones: fase de grupos y eliminatorias. Cambia de tabla abajo. Ordenado por puntos totales, luego marcadores exactos, luego resultados correctos.',

  'rules.badge': 'Reglas del juego',
  'rules.title': 'Cómo funciona la puntuación',
  'rules.exactTitle': 'Marcador exacto',
  'rules.exactBody': 'Acierta el marcador exacto —incluido un empate exacto como 2-2— y gana',
  'rules.pts3': '3 puntos',
  'rules.outcomeTitle': 'Resultado correcto, marcador no',
  'rules.outcomeBody': 'Acierta el resultado (el ganador correcto, o cualquier empate) pero no el marcador exacto —por ejemplo, predices 2-2 y termina 1-1— y gana',
  'rules.pts1': '1 punto',
  'rules.lockTitle': 'Hora de bloqueo',
  'rules.lockBody': 'Todas las predicciones de una fase se pueden añadir o cambiar hasta',
  'rules.oneHour': '1 hora antes del primer partido de esa fase',
  'rules.koTitle': 'Rondas eliminatorias',
  'rules.koBody': 'Cuando se conocen los cruces eliminatorios, los equipos se completan automáticamente. Los jugadores pueden entonces hacer nuevas predicciones para esos partidos hasta 1 hora antes del primer partido de esa ronda.',
  'rules.koScoreTitle': 'Puntuación en eliminatorias',
  'rules.koScoreBody': 'Los partidos de eliminatoria se puntúan con el marcador al terminar el juego, sin contar los penaltis. Un ganador claro en el tiempo reglamentario (90′) o en la prórroga (120′) cuenta como ese marcador final. Si sigue empatado tras la prórroga y se decide por penaltis, se puntúa como empate — la tanda de penaltis no cuenta.',
  'rules.joinTitle': 'Cómo unirse',
  'rules.joinBody': 'Dos competiciones separadas: participa en una o en ambas. Una vez registrado, envía tu inscripción por Zelle a Copo: $30 para la fase de grupos, $50 para las eliminatorias.',
  'rules.payoutTitle': 'Inscripción y premios',
  'rules.payoutGroup': 'Fase de grupos (pagado tras la fase de grupos) — 1.º: $800 · 2.º: $250 · 3.º: $150. Si hay empate, el premio se reparte en partes iguales entre los empatados.',
  'rules.payoutKnockout': 'Eliminatorias — el ganador se lleva el bote, pagado tras la final. Tabla de clasificación aparte.',

  'admin.badge': 'Solo administradores',
  'admin.title': 'Actualizar marcadores y equipos eliminatorios',
  'admin.subtitle': 'Guarda los marcadores finales aquí. La función de la base de datos recalcula los puntos y la clasificación automáticamente.',
  'admin.checking': 'Verificando acceso de administrador...',
  'admin.signInFirst': 'Inicia sesión primero. Luego marca tu perfil como administrador en Supabase.',
  'admin.notAdmin': 'Has iniciado sesión, pero tu perfil no está marcado como administrador.',
  'admin.heading': 'Admin',
  'admin.updateTeams': 'Actualizar equipos',
  'admin.saveFinal': 'Guardar marcador final',
  'admin.filterNeeds': 'Falta resultado',
  'admin.awaiting': 'Esperando resultado',
  'admin.noneToScore': 'Ningún partido está esperando resultado ahora mismo.',
  'admin.clearResult': 'Borrar resultado',
  'admin.confirmClear': '¿Borrar este resultado y poner sus puntos a 0?',
  'admin.cleared': 'borrado',

  'lang.label': 'Idioma',
};

const dicts: Record<Lang, Dict> = { en, es };

// Tournament stage names (stored in English in the DB).
const stages: Record<Lang, Dict> = {
  en: {},
  es: {
    'Group Stage': 'Fase de grupos',
    'Round of 32': 'Dieciseisavos de final',
    'Round of 16': 'Octavos de final',
    'Quarter-final': 'Cuartos de final',
    'Semi-final': 'Semifinal',
    'Third Place': 'Tercer puesto',
    'Final': 'Final',
  },
};

// Country names for the 48 finalists (DB stores English names).
const countries: Dict = {
  Mexico: 'México', 'South Africa': 'Sudáfrica', 'South Korea': 'Corea del Sur', 'Czech Republic': 'Chequia',
  Canada: 'Canadá', 'Bosnia & Herzegovina': 'Bosnia y Herzegovina', Qatar: 'Catar', Switzerland: 'Suiza',
  Brazil: 'Brasil', Morocco: 'Marruecos', Haiti: 'Haití', Scotland: 'Escocia',
  USA: 'Estados Unidos', Paraguay: 'Paraguay', Australia: 'Australia', Turkey: 'Turquía',
  Germany: 'Alemania', Curacao: 'Curazao', 'Ivory Coast': 'Costa de Marfil', Ecuador: 'Ecuador',
  Netherlands: 'Países Bajos', Japan: 'Japón', Sweden: 'Suecia', Tunisia: 'Túnez',
  Spain: 'España', 'Cape Verde': 'Cabo Verde', 'Saudi Arabia': 'Arabia Saudita', Uruguay: 'Uruguay',
  Belgium: 'Bélgica', Egypt: 'Egipto', Iran: 'Irán', 'New Zealand': 'Nueva Zelanda',
  France: 'Francia', Senegal: 'Senegal', Iraq: 'Irak', Norway: 'Noruega',
  Argentina: 'Argentina', Algeria: 'Argelia', Austria: 'Austria', Jordan: 'Jordania',
  Portugal: 'Portugal', 'DR Congo': 'RD Congo', Uzbekistan: 'Uzbekistán', Colombia: 'Colombia',
  England: 'Inglaterra', Croatia: 'Croacia', Ghana: 'Ghana', Panama: 'Panamá',
};

export function translateStage(stage: string, lang: Lang): string {
  if (lang === 'en') return stage;
  return stages.es[stage] ?? stage;
}

// Translates team names: real countries via the map, knockout placeholders by pattern.
export function translateTeam(name: string, lang: Lang): string {
  if (lang === 'en') return name;
  if (countries[name]) return countries[name];
  const m1 = name.match(/^Group ([A-L]) winners$/);
  if (m1) return `Ganador del Grupo ${m1[1]}`;
  const m2 = name.match(/^Group ([A-L]) runners-up$/);
  if (m2) return `Subcampeón del Grupo ${m2[1]}`;
  const m3 = name.match(/^Group ([A-L/]+) third place$/);
  if (m3) return `Tercero (Grupos ${m3[1]})`;
  const m4 = name.match(/^Match (\d+) winners$/);
  if (m4) return `Ganador del Partido ${m4[1]}`;
  const m5 = name.match(/^Match (\d+) losers$/);
  if (m5) return `Perdedor del Partido ${m5[1]}`;
  return name;
}

export function localeFor(lang: Lang): string {
  return lang === 'es' ? 'es-MX' : 'en-US';
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };
const LanguageContext = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = (typeof window !== 'undefined' && window.localStorage.getItem('lang')) as Lang | null;
    if (stored === 'en' || stored === 'es') setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    if (typeof window !== 'undefined') window.localStorage.setItem('lang', l);
  }

  function t(key: string): string {
    return dicts[lang][key] ?? dicts.en[key] ?? key;
  }

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useT(): Ctx {
  return useContext(LanguageContext);
}
