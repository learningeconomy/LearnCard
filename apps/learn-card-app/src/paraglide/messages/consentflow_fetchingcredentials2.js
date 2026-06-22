/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Fetchingcredentials2Inputs */

const en_consentflow_fetchingcredentials2 = /** @type {(inputs: Consentflow_Fetchingcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fetching your credentials...`)
};

const es_consentflow_fetchingcredentials2 = /** @type {(inputs: Consentflow_Fetchingcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obteniendo tus credenciales...`)
};

const fr_consentflow_fetchingcredentials2 = /** @type {(inputs: Consentflow_Fetchingcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupération de vos certifications...`)
};

const ar_consentflow_fetchingcredentials2 = /** @type {(inputs: Consentflow_Fetchingcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ جلب بيانات الاعتماد الخاصة بك...`)
};

/**
* | output |
* | --- |
* | "Fetching your credentials..." |
*
* @param {Consentflow_Fetchingcredentials2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_fetchingcredentials2 = /** @type {((inputs?: Consentflow_Fetchingcredentials2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Fetchingcredentials2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_fetchingcredentials2(inputs)
	if (locale === "es") return es_consentflow_fetchingcredentials2(inputs)
	if (locale === "fr") return fr_consentflow_fetchingcredentials2(inputs)
	return ar_consentflow_fetchingcredentials2(inputs)
});
export { consentflow_fetchingcredentials2 as "consentFlow.fetchingCredentials" }