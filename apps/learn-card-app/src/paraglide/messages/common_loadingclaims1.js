/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Loadingclaims1Inputs */

const en_common_loadingclaims1 = /** @type {(inputs: Common_Loadingclaims1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading claims…`)
};

const es_common_loadingclaims1 = /** @type {(inputs: Common_Loadingclaims1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando reclamaciones…`)
};

const fr_common_loadingclaims1 = /** @type {(inputs: Common_Loadingclaims1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des réclamations…`)
};

const ar_common_loadingclaims1 = /** @type {(inputs: Common_Loadingclaims1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل المطالبات…`)
};

/**
* | output |
* | --- |
* | "Loading claims…" |
*
* @param {Common_Loadingclaims1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_loadingclaims1 = /** @type {((inputs?: Common_Loadingclaims1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Loadingclaims1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_loadingclaims1(inputs)
	if (locale === "es") return es_common_loadingclaims1(inputs)
	if (locale === "fr") return fr_common_loadingclaims1(inputs)
	return ar_common_loadingclaims1(inputs)
});
export { common_loadingclaims1 as "common.loadingClaims" }