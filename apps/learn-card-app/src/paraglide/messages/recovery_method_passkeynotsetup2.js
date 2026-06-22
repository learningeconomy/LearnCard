/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Passkeynotsetup2Inputs */

const en_recovery_method_passkeynotsetup2 = /** @type {(inputs: Recovery_Method_Passkeynotsetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not set up`)
};

const es_recovery_method_passkeynotsetup2 = /** @type {(inputs: Recovery_Method_Passkeynotsetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No configurada`)
};

const fr_recovery_method_passkeynotsetup2 = /** @type {(inputs: Recovery_Method_Passkeynotsetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non configurée`)
};

const ar_recovery_method_passkeynotsetup2 = /** @type {(inputs: Recovery_Method_Passkeynotsetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم الإعداد`)
};

/**
* | output |
* | --- |
* | "Not set up" |
*
* @param {Recovery_Method_Passkeynotsetup2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_passkeynotsetup2 = /** @type {((inputs?: Recovery_Method_Passkeynotsetup2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Passkeynotsetup2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_passkeynotsetup2(inputs)
	if (locale === "es") return es_recovery_method_passkeynotsetup2(inputs)
	if (locale === "fr") return fr_recovery_method_passkeynotsetup2(inputs)
	return ar_recovery_method_passkeynotsetup2(inputs)
});
export { recovery_method_passkeynotsetup2 as "recovery.method.passkeyNotSetup" }