/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Protectaccount1Inputs */

const en_recovery_protectaccount1 = /** @type {(inputs: Recovery_Protectaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Protect Your Account`)
};

const es_recovery_protectaccount1 = /** @type {(inputs: Recovery_Protectaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Protege tu cuenta`)
};

const fr_recovery_protectaccount1 = /** @type {(inputs: Recovery_Protectaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Protégez votre compte`)
};

const ar_recovery_protectaccount1 = /** @type {(inputs: Recovery_Protectaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احمِ حسابك`)
};

/**
* | output |
* | --- |
* | "Protect Your Account" |
*
* @param {Recovery_Protectaccount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_protectaccount1 = /** @type {((inputs?: Recovery_Protectaccount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Protectaccount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_protectaccount1(inputs)
	if (locale === "es") return es_recovery_protectaccount1(inputs)
	if (locale === "fr") return fr_recovery_protectaccount1(inputs)
	return ar_recovery_protectaccount1(inputs)
});
export { recovery_protectaccount1 as "recovery.protectAccount" }