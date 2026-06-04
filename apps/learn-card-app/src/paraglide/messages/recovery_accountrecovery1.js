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

const de_recovery_accountrecovery1 = /** @type {(inputs: Recovery_Accountrecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kontowiederherstellung`)
};

const ar_recovery_accountrecovery1 = /** @type {(inputs: Recovery_Accountrecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استعادة الحساب`)
};

const fr_recovery_accountrecovery1 = /** @type {(inputs: Recovery_Accountrecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupération de compte`)
};

const ko_recovery_accountrecovery1 = /** @type {(inputs: Recovery_Accountrecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`계정 복구`)
};

/**
* | output |
* | --- |
* | "Account Recovery" |
*
* @param {Recovery_Accountrecovery1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_accountrecovery1 = /** @type {((inputs?: Recovery_Accountrecovery1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Accountrecovery1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_accountrecovery1(inputs)
	if (locale === "es") return es_recovery_accountrecovery1(inputs)
	if (locale === "de") return de_recovery_accountrecovery1(inputs)
	if (locale === "ar") return ar_recovery_accountrecovery1(inputs)
	if (locale === "fr") return fr_recovery_accountrecovery1(inputs)
	return ko_recovery_accountrecovery1(inputs)
});
export { recovery_accountrecovery1 as "recovery.accountRecovery" }