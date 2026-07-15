/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Email_Keylabel1Inputs */

const en_recovery_email_keylabel1 = /** @type {(inputs: Recovery_Email_Keylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery Key`)
};

const es_recovery_email_keylabel1 = /** @type {(inputs: Recovery_Email_Keylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clave de Recuperación`)
};

const fr_recovery_email_keylabel1 = /** @type {(inputs: Recovery_Email_Keylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé de récupération`)
};

const ar_recovery_email_keylabel1 = /** @type {(inputs: Recovery_Email_Keylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفتاح الاسترداد`)
};

/**
* | output |
* | --- |
* | "Recovery Key" |
*
* @param {Recovery_Email_Keylabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_email_keylabel1 = /** @type {((inputs?: Recovery_Email_Keylabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Email_Keylabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_email_keylabel1(inputs)
	if (locale === "es") return es_recovery_email_keylabel1(inputs)
	if (locale === "fr") return fr_recovery_email_keylabel1(inputs)
	return ar_recovery_email_keylabel1(inputs)
});
export { recovery_email_keylabel1 as "recovery.email.keyLabel" }