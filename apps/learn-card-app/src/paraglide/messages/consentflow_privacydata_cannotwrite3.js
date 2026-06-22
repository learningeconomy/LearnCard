/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Consentflow_Privacydata_Cannotwrite3Inputs */

const en_consentflow_privacydata_cannotwrite3 = /** @type {(inputs: Consentflow_Privacydata_Cannotwrite3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`This app is not able to write any data to your ${i?.brand}.`)
};

const es_consentflow_privacydata_cannotwrite3 = /** @type {(inputs: Consentflow_Privacydata_Cannotwrite3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Esta aplicación no puede escribir ningún dato en tu ${i?.brand}.`)
};

const fr_consentflow_privacydata_cannotwrite3 = /** @type {(inputs: Consentflow_Privacydata_Cannotwrite3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Cette application ne peut écrire aucune donnée dans votre ${i?.brand}.`)
};

const ar_consentflow_privacydata_cannotwrite3 = /** @type {(inputs: Consentflow_Privacydata_Cannotwrite3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لا يمكن لهذا التطبيق كتابة أي بيانات في ${i?.brand} الخاص بك.`)
};

/**
* | output |
* | --- |
* | "This app is not able to write any data to your {brand}." |
*
* @param {Consentflow_Privacydata_Cannotwrite3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_privacydata_cannotwrite3 = /** @type {((inputs: Consentflow_Privacydata_Cannotwrite3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Privacydata_Cannotwrite3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_privacydata_cannotwrite3(inputs)
	if (locale === "es") return es_consentflow_privacydata_cannotwrite3(inputs)
	if (locale === "fr") return fr_consentflow_privacydata_cannotwrite3(inputs)
	return ar_consentflow_privacydata_cannotwrite3(inputs)
});
export { consentflow_privacydata_cannotwrite3 as "consentFlow.privacyData.cannotWrite" }