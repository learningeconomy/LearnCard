/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Recoveryemail1Inputs */

const en_recovery_recoveryemail1 = /** @type {(inputs: Recovery_Recoveryemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery Email`)
};

const es_recovery_recoveryemail1 = /** @type {(inputs: Recovery_Recoveryemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Correo de recuperación`)
};

const fr_recovery_recoveryemail1 = /** @type {(inputs: Recovery_Recoveryemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail de récupération`)
};

const ar_recovery_recoveryemail1 = /** @type {(inputs: Recovery_Recoveryemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بريد الاسترداد`)
};

/**
* | output |
* | --- |
* | "Recovery Email" |
*
* @param {Recovery_Recoveryemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_recoveryemail1 = /** @type {((inputs?: Recovery_Recoveryemail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Recoveryemail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_recoveryemail1(inputs)
	if (locale === "es") return es_recovery_recoveryemail1(inputs)
	if (locale === "fr") return fr_recovery_recoveryemail1(inputs)
	return ar_recovery_recoveryemail1(inputs)
});
export { recovery_recoveryemail1 as "recovery.recoveryEmail" }