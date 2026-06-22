/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Restoreaccessshort2Inputs */

const en_recovery_restoreaccessshort2 = /** @type {(inputs: Recovery_Restoreaccessshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose how you’d like to restore access.`)
};

const es_recovery_restoreaccessshort2 = /** @type {(inputs: Recovery_Restoreaccessshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige cómo quieres restaurar el acceso.`)
};

const fr_recovery_restoreaccessshort2 = /** @type {(inputs: Recovery_Restoreaccessshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez comment vous souhaitez restaurer l’accès.`)
};

const ar_recovery_restoreaccessshort2 = /** @type {(inputs: Recovery_Restoreaccessshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر كيف تريد استعادة الوصول.`)
};

/**
* | output |
* | --- |
* | "Choose how you’d like to restore access." |
*
* @param {Recovery_Restoreaccessshort2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_restoreaccessshort2 = /** @type {((inputs?: Recovery_Restoreaccessshort2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Restoreaccessshort2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_restoreaccessshort2(inputs)
	if (locale === "es") return es_recovery_restoreaccessshort2(inputs)
	if (locale === "fr") return fr_recovery_restoreaccessshort2(inputs)
	return ar_recovery_restoreaccessshort2(inputs)
});
export { recovery_restoreaccessshort2 as "recovery.restoreAccessShort" }