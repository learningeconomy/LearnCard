/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Privacyanddata3Inputs */

const en_consentflow_privacyanddata3 = /** @type {(inputs: Consentflow_Privacyanddata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy & Data`)
};

const es_consentflow_privacyanddata3 = /** @type {(inputs: Consentflow_Privacyanddata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacidad y datos`)
};

const fr_consentflow_privacyanddata3 = /** @type {(inputs: Consentflow_Privacyanddata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confidentialité et données`)
};

const ar_consentflow_privacyanddata3 = /** @type {(inputs: Consentflow_Privacyanddata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخصوصية والبيانات`)
};

/**
* | output |
* | --- |
* | "Privacy & Data" |
*
* @param {Consentflow_Privacyanddata3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_privacyanddata3 = /** @type {((inputs?: Consentflow_Privacyanddata3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Privacyanddata3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_privacyanddata3(inputs)
	if (locale === "es") return es_consentflow_privacyanddata3(inputs)
	if (locale === "fr") return fr_consentflow_privacyanddata3(inputs)
	return ar_consentflow_privacyanddata3(inputs)
});
export { consentflow_privacyanddata3 as "consentFlow.privacyAndData" }