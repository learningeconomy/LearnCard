/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Passkey_Replacebtn1Inputs */

const en_recovery_setup_passkey_replacebtn1 = /** @type {(inputs: Recovery_Setup_Passkey_Replacebtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replace Passkey`)
};

const es_recovery_setup_passkey_replacebtn1 = /** @type {(inputs: Recovery_Setup_Passkey_Replacebtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reemplazar Passkey`)
};

const fr_recovery_setup_passkey_replacebtn1 = /** @type {(inputs: Recovery_Setup_Passkey_Replacebtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remplacer la clé d'accès`)
};

const ar_recovery_setup_passkey_replacebtn1 = /** @type {(inputs: Recovery_Setup_Passkey_Replacebtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replace Passkey`)
};

/**
* | output |
* | --- |
* | "Replace Passkey" |
*
* @param {Recovery_Setup_Passkey_Replacebtn1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_passkey_replacebtn1 = /** @type {((inputs?: Recovery_Setup_Passkey_Replacebtn1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Passkey_Replacebtn1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_passkey_replacebtn1(inputs)
	if (locale === "es") return es_recovery_setup_passkey_replacebtn1(inputs)
	if (locale === "fr") return fr_recovery_setup_passkey_replacebtn1(inputs)
	return ar_recovery_setup_passkey_replacebtn1(inputs)
});
export { recovery_setup_passkey_replacebtn1 as "recovery.setup.passkey.replaceBtn" }