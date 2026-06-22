/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Accountupgradeneeded2Inputs */

const en_recovery_accountupgradeneeded2 = /** @type {(inputs: Recovery_Accountupgradeneeded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Account Upgrade Needed`)
};

const es_recovery_accountupgradeneeded2 = /** @type {(inputs: Recovery_Accountupgradeneeded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualización de cuenta necesaria`)
};

const fr_recovery_accountupgradeneeded2 = /** @type {(inputs: Recovery_Accountupgradeneeded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mise à niveau du compte nécessaire`)
};

const ar_recovery_accountupgradeneeded2 = /** @type {(inputs: Recovery_Accountupgradeneeded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يلزم ترقية الحساب`)
};

/**
* | output |
* | --- |
* | "Account Upgrade Needed" |
*
* @param {Recovery_Accountupgradeneeded2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_accountupgradeneeded2 = /** @type {((inputs?: Recovery_Accountupgradeneeded2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Accountupgradeneeded2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_accountupgradeneeded2(inputs)
	if (locale === "es") return es_recovery_accountupgradeneeded2(inputs)
	if (locale === "fr") return fr_recovery_accountupgradeneeded2(inputs)
	return ar_recovery_accountupgradeneeded2(inputs)
});
export { recovery_accountupgradeneeded2 as "recovery.accountUpgradeNeeded" }