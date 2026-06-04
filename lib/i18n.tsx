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
  'fx.btnSignInToSave': 'Sign in to save',
  'fx.btnSave': 'Save prediction',
  'fx.btnSaved': '✓ Prediction saved',
  'fx.lockNote': 'Predictions lock one hour before kick-off.',

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

  'st.title': 'League Table',
  'st.refresh': 'Refresh',
  'st.colPlayer': 'Player',
  'st.colExact': 'Exact (3 points)',
  'st.colOutcome': 'Outcome (1 point)',
  'st.colTotal': 'Total Points',
  'st.colPicks': 'Picks',
  'st.empty': 'No predictions yet.',

  'stp.badge': 'Live standings',
  'stp.title': 'League table',
  'stp.subtitle': 'Ranked by total points, then exact scores, then correct outcomes.',

  'rules.badge': 'Game rules',
  'rules.title': 'How scoring works',
  'rules.exactTitle': 'Exact score',
  'rules.exactBody': 'Guess the exact result, such as 2-1, and earn',
  'rules.pts3': '3 points',
  'rules.outcomeTitle': 'Correct outcome',
  'rules.outcomeBody': 'Guess the correct winner or correctly predict a draw, but not the exact score, and earn',
  'rules.pts1': '1 point',
  'rules.lockTitle': 'Lock time',
  'rules.lockBody': 'Predictions can be added or changed until',
  'rules.oneHour': 'one hour before kick-off',
  'rules.koTitle': 'Knockout rounds',
  'rules.koBody': 'When the knockout matchups are known, the admin updates the placeholder teams. Players can then make new selections for those fixtures until the one-hour lock.',
  'rules.joinTitle': 'How to join',
  'rules.joinBody': 'Zelle $30 to Copo once signed up.',
  'rules.payoutTitle': 'Payouts',
  'rules.payout1': 'to 1st place after the group games',
  'rules.payout2': 'to 1st place after the quarter-final round',
  'rules.payout3': 'to 1st place after the final',

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
  'fx.btnSignInToSave': 'Inicia sesión para guardar',
  'fx.btnSave': 'Guardar predicción',
  'fx.btnSaved': '✓ Predicción guardada',
  'fx.lockNote': 'Las predicciones se bloquean una hora antes del inicio.',

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

  'st.title': 'Tabla de la liga',
  'st.refresh': 'Actualizar',
  'st.colPlayer': 'Jugador',
  'st.colExact': 'Exactos (3 puntos)',
  'st.colOutcome': 'Resultado (1 punto)',
  'st.colTotal': 'Puntos totales',
  'st.colPicks': 'Predic.',
  'st.empty': 'Aún no hay predicciones.',

  'stp.badge': 'Clasificación en vivo',
  'stp.title': 'Tabla de la liga',
  'stp.subtitle': 'Ordenado por puntos totales, luego marcadores exactos, luego resultados correctos.',

  'rules.badge': 'Reglas del juego',
  'rules.title': 'Cómo funciona la puntuación',
  'rules.exactTitle': 'Marcador exacto',
  'rules.exactBody': 'Adivina el resultado exacto, como 2-1, y gana',
  'rules.pts3': '3 puntos',
  'rules.outcomeTitle': 'Resultado correcto',
  'rules.outcomeBody': 'Adivina el ganador correcto o predice correctamente un empate, pero no el marcador exacto, y gana',
  'rules.pts1': '1 punto',
  'rules.lockTitle': 'Hora de bloqueo',
  'rules.lockBody': 'Las predicciones se pueden añadir o cambiar hasta',
  'rules.oneHour': 'una hora antes del inicio',
  'rules.koTitle': 'Rondas eliminatorias',
  'rules.koBody': 'Cuando se conocen los cruces eliminatorios, el administrador actualiza los equipos provisionales. Los jugadores pueden entonces hacer nuevas predicciones para esos partidos hasta el bloqueo de una hora.',
  'rules.joinTitle': 'Cómo unirse',
  'rules.joinBody': 'Envía $30 por Zelle a Copo una vez registrado.',
  'rules.payoutTitle': 'Premios',
  'rules.payout1': 'al 1.º lugar tras la fase de grupos',
  'rules.payout2': 'al 1.º lugar tras los cuartos de final',
  'rules.payout3': 'al 1.º lugar tras la final',

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
