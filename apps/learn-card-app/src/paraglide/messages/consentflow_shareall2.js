/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Shareall2Inputs */

const en_consentflow_shareall2 = /** @type {(inputs: Consentflow_Shareall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share all`)
};

const es_consentflow_shareall2 = /** @type {(inputs: Consentflow_Shareall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir todo`)
};

const fr_consentflow_shareall2 = /** @type {(inputs: Consentflow_Shareall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout partager`)
};

const ar_consentflow_shareall2 = /** @type {(inputs: Consentflow_Shareall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة الكل`)
};

/**
* | output |
* | --- |
* | "Share all" |
*
* @param {Consentflow_Shareall2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_shareall2 = /** @type {((inputs?: Consentflow_Shareall2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Shareall2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_shareall2(inputs)
	if (locale === "es") return es_consentflow_shareall2(inputs)
	if (locale === "fr") return fr_consentflow_shareall2(inputs)
	return ar_consentflow_shareall2(inputs)
});
export { consentflow_shareall2 as "consentFlow.shareAll" }