/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Issuelog_Claimed1Inputs */

const en_troops_issuelog_claimed1 = /** @type {(inputs: Troops_Issuelog_Claimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claimed {date}`)
};

const es_troops_issuelog_claimed1 = /** @type {(inputs: Troops_Issuelog_Claimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reclamado {date}`)
};

const fr_troops_issuelog_claimed1 = /** @type {(inputs: Troops_Issuelog_Claimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réclamé le {date}`)
};

const ar_troops_issuelog_claimed1 = /** @type {(inputs: Troops_Issuelog_Claimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الاستلام {date}`)
};

/**
* | output |
* | --- |
* | "Claimed {date}" |
*
* @param {Troops_Issuelog_Claimed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_issuelog_claimed1 = /** @type {((inputs?: Troops_Issuelog_Claimed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Issuelog_Claimed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_issuelog_claimed1(inputs)
	if (locale === "es") return es_troops_issuelog_claimed1(inputs)
	if (locale === "fr") return fr_troops_issuelog_claimed1(inputs)
	return ar_troops_issuelog_claimed1(inputs)
});
export { troops_issuelog_claimed1 as "troops.issueLog.claimed" }