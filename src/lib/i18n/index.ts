import { writable, derived, get } from 'svelte/store';

export type Locale = 'en' | 'es' | 'ja';
export const defaultLocale: Locale = 'en';
export const supportedLocales: Locale[] = ['en', 'es', 'ja'];

// Current locale store
export const locale = writable<Locale>(defaultLocale);

// Message catalogs loaded lazily
const catalogs = new Map<Locale, Record<string, any>>();

// Load a locale's messages
async function loadLocale(loc: Locale): Promise<Record<string, any>> {
	if (catalogs.has(loc)) return catalogs.get(loc)!;

	const messages = await import(`../../../messages/${loc}.json`);
	catalogs.set(loc, messages.default);
	return messages.default;
}

// Initialize with a locale
export async function setLocale(loc: Locale): Promise<void> {
	await loadLocale(loc);
	locale.set(loc);
	if (typeof document !== 'undefined') {
		document.documentElement.lang = loc;
		localStorage.setItem('preferred-locale', loc);
	}
}

// Get nested value from object by dot path
function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
	return path.split('.').reduce<any>((acc, key) => acc?.[key], obj) as string | undefined;
}

// Translation function - takes a key like "trigger_warning.heading" and optional params
export function t(key: string, params?: Record<string, string | number>): string {
	const loc = get(locale);
	const messages = catalogs.get(loc) ?? catalogs.get(defaultLocale);
	if (!messages) return key;

	let value = getNestedValue(messages, key);
	if (value === undefined) {
		// Fallback to English
		const fallback = catalogs.get(defaultLocale);
		value = fallback ? getNestedValue(fallback, key) : undefined;
	}
	if (value === undefined) return key;

	// Replace {param} placeholders
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
		}
	}

	return value;
}

// Reactive translation store
export const translations = derived(locale, ($locale) => {
	return (key: string, params?: Record<string, string | number>) => t(key, params);
});

// Detect browser locale on init
export function detectLocale(): Locale {
	if (typeof window === 'undefined') return defaultLocale;

	const stored = localStorage.getItem('preferred-locale');
	if (stored && supportedLocales.includes(stored as Locale)) return stored as Locale;

	const browserLang = navigator.language.split('-')[0];
	if (supportedLocales.includes(browserLang as Locale)) return browserLang as Locale;

	return defaultLocale;
}

// Initialize i18n - call this at app startup
export async function initI18n(): Promise<void> {
	// Always load English as fallback
	await loadLocale('en');
	const detected = detectLocale();
	await setLocale(detected);
}
