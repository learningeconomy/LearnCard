/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Issuelog_Empty1Inputs */

const en_troops_issuelog_empty1 = /** @type {(inputs: Troops_Issuelog_Empty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No issue history`)
};

const es_troops_issuelog_empty1 = /** @type {(inputs: Troops_Issuelog_Empty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin historial de emisión`)
};

const fr_troops_issuelog_empty1 = /** @type {(inputs: Troops_Issuelog_Empty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun historique de délivrance`)
};

const ar_troops_issuelog_empty1 = /** @type {(inputs: Troops_Issuelog_Empty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No issue history`)
};

/**
* | output |
* | --- |
* | "No issue history" |
*
* @param {Troops_Issuelog_Empty1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_issuelog_empty1 = /** @type {((inputs?: Troops_Issuelog_Empty1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Issuelog_Empty1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_issuelog_empty1(inputs)
	if (locale === "es") return es_troops_issuelog_empty1(inputs)
	if (locale === "fr") return fr_troops_issuelog_empty1(inputs)
	return ar_troops_issuelog_empty1(inputs)
});
export { troops_issuelog_empty1 as "troops.issueLog.empty" }