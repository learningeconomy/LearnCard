/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Loadingverifiablecredentials2Inputs */

const en_common_loadingverifiablecredentials2 = /** @type {(inputs: Common_Loadingverifiablecredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading verifiable credentials...`)
};

const es_common_loadingverifiablecredentials2 = /** @type {(inputs: Common_Loadingverifiablecredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando credenciales verificables...`)
};

const fr_common_loadingverifiablecredentials2 = /** @type {(inputs: Common_Loadingverifiablecredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des justificatifs vérifiables...`)
};

const ar_common_loadingverifiablecredentials2 = /** @type {(inputs: Common_Loadingverifiablecredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل بيانات الاعتماد القابلة للتحقق...`)
};

/**
* | output |
* | --- |
* | "Loading verifiable credentials..." |
*
* @param {Common_Loadingverifiablecredentials2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_loadingverifiablecredentials2 = /** @type {((inputs?: Common_Loadingverifiablecredentials2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Loadingverifiablecredentials2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_loadingverifiablecredentials2(inputs)
	if (locale === "es") return es_common_loadingverifiablecredentials2(inputs)
	if (locale === "fr") return fr_common_loadingverifiablecredentials2(inputs)
	return ar_common_loadingverifiablecredentials2(inputs)
});
export { common_loadingverifiablecredentials2 as "common.loadingVerifiableCredentials" }