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

const fr_ai_loadingroles1 = /** @type {(inputs: Ai_Loadingroles1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des rôles...`)
};

const ar_ai_loadingroles1 = /** @type {(inputs: Ai_Loadingroles1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل الأدوار...`)
};

/**
* | output |
* | --- |
* | "Loading roles..." |
*
* @param {Ai_Loadingroles1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_loadingroles1 = /** @type {((inputs?: Ai_Loadingroles1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Loadingroles1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_loadingroles1(inputs)
	if (locale === "es") return es_ai_loadingroles1(inputs)
	if (locale === "fr") return fr_ai_loadingroles1(inputs)
	return ar_ai_loadingroles1(inputs)
});
export { ai_loadingroles1 as "ai.loadingRoles" }