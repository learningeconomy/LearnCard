/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Skipfornow2Inputs */

const en_pathways_skipfornow2 = /** @type {(inputs: Pathways_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skip for Now`)
};

const es_pathways_skipfornow2 = /** @type {(inputs: Pathways_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Omitir por ahora`)
};

const de_pathways_skipfornow2 = /** @type {(inputs: Pathways_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vorerst überspringen`)
};

const ar_pathways_skipfornow2 = /** @type {(inputs: Pathways_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخطٍّ مؤقت`)
};

const fr_pathways_skipfornow2 = /** @type {(inputs: Pathways_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passer pour le moment`)
};

const ko_pathways_skipfornow2 = /** @type {(inputs: Pathways_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`지금은 건너뛰기`)
};

/**
* | output |
* | --- |
* | "Skip for Now" |
*
* @param {Pathways_Skipfornow2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_skipfornow2 = /** @type {((inputs?: Pathways_Skipfornow2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Skipfornow2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_skipfornow2(inputs)
	if (locale === "es") return es_pathways_skipfornow2(inputs)
	if (locale === "de") return de_pathways_skipfornow2(inputs)
	if (locale === "ar") return ar_pathways_skipfornow2(inputs)
	if (locale === "fr") return fr_pathways_skipfornow2(inputs)
	return ko_pathways_skipfornow2(inputs)
});
export { pathways_skipfornow2 as "pathways.skipForNow" }