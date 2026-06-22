/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Currentposition1Inputs */

const en_pathways_currentposition1 = /** @type {(inputs: Pathways_Currentposition1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Current position`)
};

const es_pathways_currentposition1 = /** @type {(inputs: Pathways_Currentposition1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Posición actual`)
};

const fr_pathways_currentposition1 = /** @type {(inputs: Pathways_Currentposition1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Poste actuel`)
};

const ar_pathways_currentposition1 = /** @type {(inputs: Pathways_Currentposition1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المنصب الحالي`)
};

/**
* | output |
* | --- |
* | "Current position" |
*
* @param {Pathways_Currentposition1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_currentposition1 = /** @type {((inputs?: Pathways_Currentposition1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Currentposition1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_currentposition1(inputs)
	if (locale === "es") return es_pathways_currentposition1(inputs)
	if (locale === "fr") return fr_pathways_currentposition1(inputs)
	return ar_pathways_currentposition1(inputs)
});
export { pathways_currentposition1 as "pathways.currentPosition" }