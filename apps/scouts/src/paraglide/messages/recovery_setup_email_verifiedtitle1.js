/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Email_Verifiedtitle1Inputs */

const en_recovery_setup_email_verifiedtitle1 = /** @type {(inputs: Recovery_Setup_Email_Verifiedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email verified`)
};

const es_recovery_setup_email_verifiedtitle1 = /** @type {(inputs: Recovery_Setup_Email_Verifiedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Correo verificado`)
};

const fr_recovery_setup_email_verifiedtitle1 = /** @type {(inputs: Recovery_Setup_Email_Verifiedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail vérifié`)
};

const ar_recovery_setup_email_verifiedtitle1 = /** @type {(inputs: Recovery_Setup_Email_Verifiedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email verified`)
};

/**
* | output |
* | --- |
* | "Email verified" |
*
* @param {Recovery_Setup_Email_Verifiedtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_verifiedtitle1 = /** @type {((inputs?: Recovery_Setup_Email_Verifiedtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_Verifiedtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_verifiedtitle1(inputs)
	if (locale === "es") return es_recovery_setup_email_verifiedtitle1(inputs)
	if (locale === "fr") return fr_recovery_setup_email_verifiedtitle1(inputs)
	return ar_recovery_setup_email_verifiedtitle1(inputs)
});
export { recovery_setup_email_verifiedtitle1 as "recovery.setup.email.verifiedTitle" }