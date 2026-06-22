/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Accountrecovery1Inputs */

const en_recovery_accountrecovery1 = /** @type {(inputs: Recovery_Accountrecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Account Recovery`)
};

const es_recovery_accountrecovery1 = /** @type {(inputs: Recovery_Accountrecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recuperación de cuenta`)
};

const fr_recovery_accountrecovery1 = /** @type {(inputs: Recovery_Accountrecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupération de compte`)
};

const ar_recovery_accountrecovery1 = /** @type {(inputs: Recovery_Accountrecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استعادة الحساب`)
};

/**
* | output |
* | --- |
* | "Account Recovery" |
*
* @param {Recovery_Accountrecovery1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_accountrecovery1 = /** @type {((inputs?: Recovery_Accountrecovery1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Accountrecovery1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_accountrecovery1(inputs)
	if (locale === "es") return es_recovery_accountrecovery1(inputs)
	if (locale === "fr") return fr_recovery_accountrecovery1(inputs)
	return ar_recovery_accountrecovery1(inputs)
});
export { recovery_accountrecovery1 as "recovery.accountRecovery" }