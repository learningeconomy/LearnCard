/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Privacydata_Sharepersonaldata4Inputs */

const en_consentflow_privacydata_sharepersonaldata4 = /** @type {(inputs: Consentflow_Privacydata_Sharepersonaldata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share Your Personal Data`)
};

const es_consentflow_privacydata_sharepersonaldata4 = /** @type {(inputs: Consentflow_Privacydata_Sharepersonaldata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comparte tus datos personales`)
};

const fr_consentflow_privacydata_sharepersonaldata4 = /** @type {(inputs: Consentflow_Privacydata_Sharepersonaldata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partagez vos données personnelles`)
};

const ar_consentflow_privacydata_sharepersonaldata4 = /** @type {(inputs: Consentflow_Privacydata_Sharepersonaldata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارك بياناتك الشخصية`)
};

/**
* | output |
* | --- |
* | "Share Your Personal Data" |
*
* @param {Consentflow_Privacydata_Sharepersonaldata4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_privacydata_sharepersonaldata4 = /** @type {((inputs?: Consentflow_Privacydata_Sharepersonaldata4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Privacydata_Sharepersonaldata4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_privacydata_sharepersonaldata4(inputs)
	if (locale === "es") return es_consentflow_privacydata_sharepersonaldata4(inputs)
	if (locale === "fr") return fr_consentflow_privacydata_sharepersonaldata4(inputs)
	return ar_consentflow_privacydata_sharepersonaldata4(inputs)
});
export { consentflow_privacydata_sharepersonaldata4 as "consentFlow.privacyData.sharePersonalData" }