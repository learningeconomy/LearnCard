/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Recoveraccount1Inputs */

const en_recovery_recoveraccount1 = /** @type {(inputs: Recovery_Recoveraccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recover Account`)
};

const es_recovery_recoveraccount1 = /** @type {(inputs: Recovery_Recoveraccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recuperar cuenta`)
};

const fr_recovery_recoveraccount1 = /** @type {(inputs: Recovery_Recoveraccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupérer le compte`)
};

const ar_recovery_recoveraccount1 = /** @type {(inputs: Recovery_Recoveraccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استعادة الحساب`)
};

/**
* | output |
* | --- |
* | "Recover Account" |
*
* @param {Recovery_Recoveraccount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_recoveraccount1 = /** @type {((inputs?: Recovery_Recoveraccount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Recoveraccount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_recoveraccount1(inputs)
	if (locale === "es") return es_recovery_recoveraccount1(inputs)
	if (locale === "fr") return fr_recovery_recoveraccount1(inputs)
	return ar_recovery_recoveraccount1(inputs)
});
export { recovery_recoveraccount1 as "recovery.recoverAccount" }