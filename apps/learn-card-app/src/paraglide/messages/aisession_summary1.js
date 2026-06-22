/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aisession_Summary1Inputs */

const en_aisession_summary1 = /** @type {(inputs: Aisession_Summary1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Session Summary`)
};

const es_aisession_summary1 = /** @type {(inputs: Aisession_Summary1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resumen de sesión de IA`)
};

const fr_aisession_summary1 = /** @type {(inputs: Aisession_Summary1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résumé de session IA`)
};

const ar_aisession_summary1 = /** @type {(inputs: Aisession_Summary1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملخص جلسة الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Session Summary" |
*
* @param {Aisession_Summary1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aisession_summary1 = /** @type {((inputs?: Aisession_Summary1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aisession_Summary1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aisession_summary1(inputs)
	if (locale === "es") return es_aisession_summary1(inputs)
	if (locale === "fr") return fr_aisession_summary1(inputs)
	return ar_aisession_summary1(inputs)
});
export { aisession_summary1 as "aiSession.summary" }