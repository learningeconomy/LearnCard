/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Loadingclaimstoshare3Inputs */

const en_common_loadingclaimstoshare3 = /** @type {(inputs: Common_Loadingclaimstoshare3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading claims to share…`)
};

const es_common_loadingclaimstoshare3 = /** @type {(inputs: Common_Loadingclaimstoshare3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando reclamaciones para compartir…`)
};

const fr_common_loadingclaimstoshare3 = /** @type {(inputs: Common_Loadingclaimstoshare3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des réclamations à partager…`)
};

const ar_common_loadingclaimstoshare3 = /** @type {(inputs: Common_Loadingclaimstoshare3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل المطالبات للمشاركة…`)
};

/**
* | output |
* | --- |
* | "Loading claims to share…" |
*
* @param {Common_Loadingclaimstoshare3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_loadingclaimstoshare3 = /** @type {((inputs?: Common_Loadingclaimstoshare3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Loadingclaimstoshare3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_loadingclaimstoshare3(inputs)
	if (locale === "es") return es_common_loadingclaimstoshare3(inputs)
	if (locale === "fr") return fr_common_loadingclaimstoshare3(inputs)
	return ar_common_loadingclaimstoshare3(inputs)
});
export { common_loadingclaimstoshare3 as "common.loadingClaimsToShare" }