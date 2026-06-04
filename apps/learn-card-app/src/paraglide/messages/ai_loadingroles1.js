/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Loadingroles1Inputs */

const en_ai_loadingroles1 = /** @type {(inputs: Ai_Loadingroles1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading roles...`)
};

const es_ai_loadingroles1 = /** @type {(inputs: Ai_Loadingroles1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando roles...`)
};

const de_ai_loadingroles1 = /** @type {(inputs: Ai_Loadingroles1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rollen werden geladen...`)
};

const ar_ai_loadingroles1 = /** @type {(inputs: Ai_Loadingroles1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل الأدوار...`)
};

const fr_ai_loadingroles1 = /** @type {(inputs: Ai_Loadingroles1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des rôles...`)
};

const ko_ai_loadingroles1 = /** @type {(inputs: Ai_Loadingroles1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`역할 로딩 중...`)
};

/**
* | output |
* | --- |
* | "Loading roles..." |
*
* @param {Ai_Loadingroles1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_loadingroles1 = /** @type {((inputs?: Ai_Loadingroles1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Loadingroles1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_loadingroles1(inputs)
	if (locale === "es") return es_ai_loadingroles1(inputs)
	if (locale === "de") return de_ai_loadingroles1(inputs)
	if (locale === "ar") return ar_ai_loadingroles1(inputs)
	if (locale === "fr") return fr_ai_loadingroles1(inputs)
	return ko_ai_loadingroles1(inputs)
});
export { ai_loadingroles1 as "ai.loadingRoles" }