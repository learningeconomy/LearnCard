/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Minorwarning1Inputs */

const en_settings_minorwarning1 = /** @type {(inputs: Settings_Minorwarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Features are restricted for users under 18.`)
};

const es_settings_minorwarning1 = /** @type {(inputs: Settings_Minorwarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las funciones de IA están restringidas para menores de 18 años.`)
};

const fr_settings_minorwarning1 = /** @type {(inputs: Settings_Minorwarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les fonctionnalités d'IA sont restreintes pour les utilisateurs de moins de 18 ans.`)
};

const ar_settings_minorwarning1 = /** @type {(inputs: Settings_Minorwarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ميزات الذكاء الاصطناعي مقيّدة للمستخدمين دون سن 18 عامًا.`)
};

/**
* | output |
* | --- |
* | "AI Features are restricted for users under 18." |
*
* @param {Settings_Minorwarning1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_minorwarning1 = /** @type {((inputs?: Settings_Minorwarning1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Minorwarning1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_minorwarning1(inputs)
	if (locale === "es") return es_settings_minorwarning1(inputs)
	if (locale === "fr") return fr_settings_minorwarning1(inputs)
	return ar_settings_minorwarning1(inputs)
});
export { settings_minorwarning1 as "settings.minorWarning" }