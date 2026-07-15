/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Skipfornow2Inputs */

const en_common_skipfornow2 = /** @type {(inputs: Common_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skip for Now`)
};

const es_common_skipfornow2 = /** @type {(inputs: Common_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Omitir por ahora`)
};

const fr_common_skipfornow2 = /** @type {(inputs: Common_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passer pour le moment`)
};

const ar_common_skipfornow2 = /** @type {(inputs: Common_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخطٍّ مؤقت`)
};

/**
* | output |
* | --- |
* | "Skip for Now" |
*
* @param {Common_Skipfornow2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_skipfornow2 = /** @type {((inputs?: Common_Skipfornow2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Skipfornow2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_skipfornow2(inputs)
	if (locale === "es") return es_common_skipfornow2(inputs)
	if (locale === "fr") return fr_common_skipfornow2(inputs)
	return ar_common_skipfornow2(inputs)
});
export { common_skipfornow2 as "common.skipForNow" }