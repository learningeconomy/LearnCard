/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Getpermission1Inputs */

const en_ai_getpermission1 = /** @type {(inputs: Ai_Getpermission1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get Permission`)
};

const es_ai_getpermission1 = /** @type {(inputs: Ai_Getpermission1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener permiso`)
};

const fr_ai_getpermission1 = /** @type {(inputs: Ai_Getpermission1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir la permission`)
};

const ar_ai_getpermission1 = /** @type {(inputs: Ai_Getpermission1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحصول على إذن`)
};

/**
* | output |
* | --- |
* | "Get Permission" |
*
* @param {Ai_Getpermission1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_getpermission1 = /** @type {((inputs?: Ai_Getpermission1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Getpermission1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_getpermission1(inputs)
	if (locale === "es") return es_ai_getpermission1(inputs)
	if (locale === "fr") return fr_ai_getpermission1(inputs)
	return ar_ai_getpermission1(inputs)
});
export { ai_getpermission1 as "ai.getPermission" }