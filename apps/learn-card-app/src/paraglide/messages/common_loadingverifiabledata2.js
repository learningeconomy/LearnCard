/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Loadingverifiabledata2Inputs */

const en_common_loadingverifiabledata2 = /** @type {(inputs: Common_Loadingverifiabledata2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading verifiable data...`)
};

const es_common_loadingverifiabledata2 = /** @type {(inputs: Common_Loadingverifiabledata2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando datos verificables...`)
};

const fr_common_loadingverifiabledata2 = /** @type {(inputs: Common_Loadingverifiabledata2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des données vérifiables...`)
};

const ar_common_loadingverifiabledata2 = /** @type {(inputs: Common_Loadingverifiabledata2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل البيانات القابلة للتحقق...`)
};

/**
* | output |
* | --- |
* | "Loading verifiable data..." |
*
* @param {Common_Loadingverifiabledata2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_loadingverifiabledata2 = /** @type {((inputs?: Common_Loadingverifiabledata2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Loadingverifiabledata2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_loadingverifiabledata2(inputs)
	if (locale === "es") return es_common_loadingverifiabledata2(inputs)
	if (locale === "fr") return fr_common_loadingverifiabledata2(inputs)
	return ar_common_loadingverifiabledata2(inputs)
});
export { common_loadingverifiabledata2 as "common.loadingVerifiableData" }