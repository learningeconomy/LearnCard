/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Consentflow_Privacydata_Cannotread3Inputs */

const en_consentflow_privacydata_cannotread3 = /** @type {(inputs: Consentflow_Privacydata_Cannotread3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`This app is not able to read any credentials from your ${i?.brand}.`)
};

const es_consentflow_privacydata_cannotread3 = /** @type {(inputs: Consentflow_Privacydata_Cannotread3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Esta aplicación no puede leer ninguna credencial de tu ${i?.brand}.`)
};

const fr_consentflow_privacydata_cannotread3 = /** @type {(inputs: Consentflow_Privacydata_Cannotread3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Cette application ne peut lire aucun justificatif de votre ${i?.brand}.`)
};

const ar_consentflow_privacydata_cannotread3 = /** @type {(inputs: Consentflow_Privacydata_Cannotread3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لا يمكن لهذا التطبيق قراءة أي بيانات اعتماد من ${i?.brand} الخاص بك.`)
};

/**
* | output |
* | --- |
* | "This app is not able to read any credentials from your {brand}." |
*
* @param {Consentflow_Privacydata_Cannotread3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_privacydata_cannotread3 = /** @type {((inputs: Consentflow_Privacydata_Cannotread3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Privacydata_Cannotread3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_privacydata_cannotread3(inputs)
	if (locale === "es") return es_consentflow_privacydata_cannotread3(inputs)
	if (locale === "fr") return fr_consentflow_privacydata_cannotread3(inputs)
	return ar_consentflow_privacydata_cannotread3(inputs)
});
export { consentflow_privacydata_cannotread3 as "consentFlow.privacyData.cannotRead" }