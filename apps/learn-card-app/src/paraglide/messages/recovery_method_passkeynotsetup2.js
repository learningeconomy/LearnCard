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

const de_recovery_method_passkeynotsetup2 = /** @type {(inputs: Recovery_Method_Passkeynotsetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nicht eingerichtet`)
};

const ar_recovery_method_passkeynotsetup2 = /** @type {(inputs: Recovery_Method_Passkeynotsetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم الإعداد`)
};

const fr_recovery_method_passkeynotsetup2 = /** @type {(inputs: Recovery_Method_Passkeynotsetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non configurée`)
};

const ko_recovery_method_passkeynotsetup2 = /** @type {(inputs: Recovery_Method_Passkeynotsetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`설정되지 않음`)
};

/**
* | output |
* | --- |
* | "Not set up" |
*
* @param {Recovery_Method_Passkeynotsetup2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_method_passkeynotsetup2 = /** @type {((inputs?: Recovery_Method_Passkeynotsetup2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Passkeynotsetup2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_passkeynotsetup2(inputs)
	if (locale === "es") return es_recovery_method_passkeynotsetup2(inputs)
	if (locale === "de") return de_recovery_method_passkeynotsetup2(inputs)
	if (locale === "ar") return ar_recovery_method_passkeynotsetup2(inputs)
	if (locale === "fr") return fr_recovery_method_passkeynotsetup2(inputs)
	return ko_recovery_method_passkeynotsetup2(inputs)
});
export { recovery_method_passkeynotsetup2 as "recovery.method.passkeyNotSetup" }