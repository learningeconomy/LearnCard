/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Passkeydesc1Inputs */

const en_recovery_method_passkeydesc1 = /** @type {(inputs: Recovery_Method_Passkeydesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use Face ID, Touch ID, or similar`)
};

const es_recovery_method_passkeydesc1 = /** @type {(inputs: Recovery_Method_Passkeydesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa Face ID, Touch ID o similar`)
};

const de_recovery_method_passkeydesc1 = /** @type {(inputs: Recovery_Method_Passkeydesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Face ID, Touch ID oder ähnliches verwenden`)
};

const ar_recovery_method_passkeydesc1 = /** @type {(inputs: Recovery_Method_Passkeydesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم Face ID أو Touch ID أو ما شابه`)
};

const fr_recovery_method_passkeydesc1 = /** @type {(inputs: Recovery_Method_Passkeydesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utiliser Face ID, Touch ID ou similaire`)
};

const ko_recovery_method_passkeydesc1 = /** @type {(inputs: Recovery_Method_Passkeydesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Face ID, Touch ID 등 사용`)
};

/**
* | output |
* | --- |
* | "Use Face ID, Touch ID, or similar" |
*
* @param {Recovery_Method_Passkeydesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_method_passkeydesc1 = /** @type {((inputs?: Recovery_Method_Passkeydesc1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Passkeydesc1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_passkeydesc1(inputs)
	if (locale === "es") return es_recovery_method_passkeydesc1(inputs)
	if (locale === "de") return de_recovery_method_passkeydesc1(inputs)
	if (locale === "ar") return ar_recovery_method_passkeydesc1(inputs)
	if (locale === "fr") return fr_recovery_method_passkeydesc1(inputs)
	return ko_recovery_method_passkeydesc1(inputs)
});
export { recovery_method_passkeydesc1 as "recovery.method.passkeyDesc" }