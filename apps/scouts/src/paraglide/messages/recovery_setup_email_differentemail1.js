/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Email_Differentemail1Inputs */

const en_recovery_setup_email_differentemail1 = /** @type {(inputs: Recovery_Setup_Email_Differentemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use a different email`)
};

const es_recovery_setup_email_differentemail1 = /** @type {(inputs: Recovery_Setup_Email_Differentemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usar un correo diferente`)
};

const fr_recovery_setup_email_differentemail1 = /** @type {(inputs: Recovery_Setup_Email_Differentemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utiliser un e-mail différent`)
};

const ar_recovery_setup_email_differentemail1 = /** @type {(inputs: Recovery_Setup_Email_Differentemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم بريداً إلكترونياً مختلفاً`)
};

/**
* | output |
* | --- |
* | "Use a different email" |
*
* @param {Recovery_Setup_Email_Differentemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_differentemail1 = /** @type {((inputs?: Recovery_Setup_Email_Differentemail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_Differentemail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_differentemail1(inputs)
	if (locale === "es") return es_recovery_setup_email_differentemail1(inputs)
	if (locale === "fr") return fr_recovery_setup_email_differentemail1(inputs)
	return ar_recovery_setup_email_differentemail1(inputs)
});
export { recovery_setup_email_differentemail1 as "recovery.setup.email.differentEmail" }