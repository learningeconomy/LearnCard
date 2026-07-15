/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Sharingall2Inputs */

const en_consentflow_sharingall2 = /** @type {(inputs: Consentflow_Sharingall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sharing All`)
};

const es_consentflow_sharingall2 = /** @type {(inputs: Consentflow_Sharingall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartiendo Todo`)
};

const fr_consentflow_sharingall2 = /** @type {(inputs: Consentflow_Sharingall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partage total`)
};

const ar_consentflow_sharingall2 = /** @type {(inputs: Consentflow_Sharingall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة الكل`)
};

/**
* | output |
* | --- |
* | "Sharing All" |
*
* @param {Consentflow_Sharingall2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_sharingall2 = /** @type {((inputs?: Consentflow_Sharingall2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Sharingall2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_sharingall2(inputs)
	if (locale === "es") return es_consentflow_sharingall2(inputs)
	if (locale === "fr") return fr_consentflow_sharingall2(inputs)
	return ar_consentflow_sharingall2(inputs)
});
export { consentflow_sharingall2 as "consentFlow.sharingAll" }