/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Consentflow_Privacydata_Sharedata3Inputs */

const en_consentflow_privacydata_sharedata3 = /** @type {(inputs: Consentflow_Privacydata_Sharedata3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Share Your ${i?.brand} Data`)
};

const es_consentflow_privacydata_sharedata3 = /** @type {(inputs: Consentflow_Privacydata_Sharedata3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Comparte tus datos de ${i?.brand}`)
};

const fr_consentflow_privacydata_sharedata3 = /** @type {(inputs: Consentflow_Privacydata_Sharedata3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Partagez vos données ${i?.brand}`)
};

const ar_consentflow_privacydata_sharedata3 = /** @type {(inputs: Consentflow_Privacydata_Sharedata3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`شارك بيانات ${i?.brand} الخاصة بك`)
};

/**
* | output |
* | --- |
* | "Share Your {brand} Data" |
*
* @param {Consentflow_Privacydata_Sharedata3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_privacydata_sharedata3 = /** @type {((inputs: Consentflow_Privacydata_Sharedata3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Privacydata_Sharedata3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_privacydata_sharedata3(inputs)
	if (locale === "es") return es_consentflow_privacydata_sharedata3(inputs)
	if (locale === "fr") return fr_consentflow_privacydata_sharedata3(inputs)
	return ar_consentflow_privacydata_sharedata3(inputs)
});
export { consentflow_privacydata_sharedata3 as "consentFlow.privacyData.shareData" }