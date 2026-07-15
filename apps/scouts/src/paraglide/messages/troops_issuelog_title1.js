/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Issuelog_Title1Inputs */

const en_troops_issuelog_title1 = /** @type {(inputs: Troops_Issuelog_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Log`)
};

const es_troops_issuelog_title1 = /** @type {(inputs: Troops_Issuelog_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registro de Emisión`)
};

const fr_troops_issuelog_title1 = /** @type {(inputs: Troops_Issuelog_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Journal de délivrance`)
};

const ar_troops_issuelog_title1 = /** @type {(inputs: Troops_Issuelog_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل الإصدار`)
};

/**
* | output |
* | --- |
* | "Issue Log" |
*
* @param {Troops_Issuelog_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_issuelog_title1 = /** @type {((inputs?: Troops_Issuelog_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Issuelog_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_issuelog_title1(inputs)
	if (locale === "es") return es_troops_issuelog_title1(inputs)
	if (locale === "fr") return fr_troops_issuelog_title1(inputs)
	return ar_troops_issuelog_title1(inputs)
});
export { troops_issuelog_title1 as "troops.issueLog.title" }