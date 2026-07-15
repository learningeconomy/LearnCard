/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Issuelog_Issued1Inputs */

const en_troops_issuelog_issued1 = /** @type {(inputs: Troops_Issuelog_Issued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued to {name}`)
};

const es_troops_issuelog_issued1 = /** @type {(inputs: Troops_Issuelog_Issued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitido a {name}`)
};

const fr_troops_issuelog_issued1 = /** @type {(inputs: Troops_Issuelog_Issued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délivré à {name}`)
};

const ar_troops_issuelog_issued1 = /** @type {(inputs: Troops_Issuelog_Issued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صدر لـ {name}`)
};

/**
* | output |
* | --- |
* | "Issued to {name}" |
*
* @param {Troops_Issuelog_Issued1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_issuelog_issued1 = /** @type {((inputs?: Troops_Issuelog_Issued1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Issuelog_Issued1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_issuelog_issued1(inputs)
	if (locale === "es") return es_troops_issuelog_issued1(inputs)
	if (locale === "fr") return fr_troops_issuelog_issued1(inputs)
	return ar_troops_issuelog_issued1(inputs)
});
export { troops_issuelog_issued1 as "troops.issueLog.issued" }