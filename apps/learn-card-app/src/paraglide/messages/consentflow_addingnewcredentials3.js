/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Addingnewcredentials3Inputs */

const en_consentflow_addingnewcredentials3 = /** @type {(inputs: Consentflow_Addingnewcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adding New Credentials`)
};

const es_consentflow_addingnewcredentials3 = /** @type {(inputs: Consentflow_Addingnewcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregando nuevas credenciales`)
};

const fr_consentflow_addingnewcredentials3 = /** @type {(inputs: Consentflow_Addingnewcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajout de nouvelles certifications`)
};

const ar_consentflow_addingnewcredentials3 = /** @type {(inputs: Consentflow_Addingnewcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة بيانات اعتماد جديدة`)
};

/**
* | output |
* | --- |
* | "Adding New Credentials" |
*
* @param {Consentflow_Addingnewcredentials3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_addingnewcredentials3 = /** @type {((inputs?: Consentflow_Addingnewcredentials3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Addingnewcredentials3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_addingnewcredentials3(inputs)
	if (locale === "es") return es_consentflow_addingnewcredentials3(inputs)
	if (locale === "fr") return fr_consentflow_addingnewcredentials3(inputs)
	return ar_consentflow_addingnewcredentials3(inputs)
});
export { consentflow_addingnewcredentials3 as "consentFlow.addingNewCredentials" }