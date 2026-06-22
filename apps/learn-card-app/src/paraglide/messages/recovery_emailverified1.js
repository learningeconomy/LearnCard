/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Emailverified1Inputs */

const en_recovery_emailverified1 = /** @type {(inputs: Recovery_Emailverified1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email verified`)
};

const es_recovery_emailverified1 = /** @type {(inputs: Recovery_Emailverified1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Correo verificado`)
};

const fr_recovery_emailverified1 = /** @type {(inputs: Recovery_Emailverified1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail vérifié`)
};

const ar_recovery_emailverified1 = /** @type {(inputs: Recovery_Emailverified1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم التحقق من البريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Email verified" |
*
* @param {Recovery_Emailverified1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_emailverified1 = /** @type {((inputs?: Recovery_Emailverified1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Emailverified1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_emailverified1(inputs)
	if (locale === "es") return es_recovery_emailverified1(inputs)
	if (locale === "fr") return fr_recovery_emailverified1(inputs)
	return ar_recovery_emailverified1(inputs)
});
export { recovery_emailverified1 as "recovery.emailVerified" }