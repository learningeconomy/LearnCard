/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Email_Codeplaceholder1Inputs */

const en_recovery_setup_email_codeplaceholder1 = /** @type {(inputs: Recovery_Setup_Email_Codeplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`123456`)
};

const es_recovery_setup_email_codeplaceholder1 = /** @type {(inputs: Recovery_Setup_Email_Codeplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`123456`)
};

const fr_recovery_setup_email_codeplaceholder1 = /** @type {(inputs: Recovery_Setup_Email_Codeplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`123456`)
};

const ar_recovery_setup_email_codeplaceholder1 = /** @type {(inputs: Recovery_Setup_Email_Codeplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`123456`)
};

/**
* | output |
* | --- |
* | "123456" |
*
* @param {Recovery_Setup_Email_Codeplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_codeplaceholder1 = /** @type {((inputs?: Recovery_Setup_Email_Codeplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_Codeplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_codeplaceholder1(inputs)
	if (locale === "es") return es_recovery_setup_email_codeplaceholder1(inputs)
	if (locale === "fr") return fr_recovery_setup_email_codeplaceholder1(inputs)
	return ar_recovery_setup_email_codeplaceholder1(inputs)
});
export { recovery_setup_email_codeplaceholder1 as "recovery.setup.email.codePlaceholder" }