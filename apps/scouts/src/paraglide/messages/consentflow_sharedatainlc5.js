/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Sharedatainlc5Inputs */

const en_consentflow_sharedatainlc5 = /** @type {(inputs: Consentflow_Sharedatainlc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share Data in Your LearnCard`)
};

const es_consentflow_sharedatainlc5 = /** @type {(inputs: Consentflow_Sharedatainlc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir Datos en Tu LearnCard`)
};

const fr_consentflow_sharedatainlc5 = /** @type {(inputs: Consentflow_Sharedatainlc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager les données dans votre LearnCard`)
};

const ar_consentflow_sharedatainlc5 = /** @type {(inputs: Consentflow_Sharedatainlc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة البيانات في LearnCard الخاص بك`)
};

/**
* | output |
* | --- |
* | "Share Data in Your LearnCard" |
*
* @param {Consentflow_Sharedatainlc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_sharedatainlc5 = /** @type {((inputs?: Consentflow_Sharedatainlc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Sharedatainlc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_sharedatainlc5(inputs)
	if (locale === "es") return es_consentflow_sharedatainlc5(inputs)
	if (locale === "fr") return fr_consentflow_sharedatainlc5(inputs)
	return ar_consentflow_sharedatainlc5(inputs)
});
export { consentflow_sharedatainlc5 as "consentFlow.shareDataInLC" }