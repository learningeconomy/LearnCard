/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Email_Emaillabel1Inputs */

const en_recovery_setup_email_emaillabel1 = /** @type {(inputs: Recovery_Setup_Email_Emaillabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery Email`)
};

const es_recovery_setup_email_emaillabel1 = /** @type {(inputs: Recovery_Setup_Email_Emaillabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Correo de Recuperación`)
};

const fr_recovery_setup_email_emaillabel1 = /** @type {(inputs: Recovery_Setup_Email_Emaillabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail de récupération`)
};

const ar_recovery_setup_email_emaillabel1 = /** @type {(inputs: Recovery_Setup_Email_Emaillabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery Email`)
};

/**
* | output |
* | --- |
* | "Recovery Email" |
*
* @param {Recovery_Setup_Email_Emaillabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_emaillabel1 = /** @type {((inputs?: Recovery_Setup_Email_Emaillabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_Emaillabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_emaillabel1(inputs)
	if (locale === "es") return es_recovery_setup_email_emaillabel1(inputs)
	if (locale === "fr") return fr_recovery_setup_email_emaillabel1(inputs)
	return ar_recovery_setup_email_emaillabel1(inputs)
});
export { recovery_setup_email_emaillabel1 as "recovery.setup.email.emailLabel" }