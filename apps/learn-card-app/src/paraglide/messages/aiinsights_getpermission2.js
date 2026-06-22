/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Getpermission2Inputs */

const en_aiinsights_getpermission2 = /** @type {(inputs: Aiinsights_Getpermission2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get Permission`)
};

const es_aiinsights_getpermission2 = /** @type {(inputs: Aiinsights_Getpermission2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener permiso`)
};

const fr_aiinsights_getpermission2 = /** @type {(inputs: Aiinsights_Getpermission2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir l'autorisation`)
};

const ar_aiinsights_getpermission2 = /** @type {(inputs: Aiinsights_Getpermission2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحصول على إذن`)
};

/**
* | output |
* | --- |
* | "Get Permission" |
*
* @param {Aiinsights_Getpermission2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_getpermission2 = /** @type {((inputs?: Aiinsights_Getpermission2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Getpermission2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_getpermission2(inputs)
	if (locale === "es") return es_aiinsights_getpermission2(inputs)
	if (locale === "fr") return fr_aiinsights_getpermission2(inputs)
	return ar_aiinsights_getpermission2(inputs)
});
export { aiinsights_getpermission2 as "aiInsights.getPermission" }