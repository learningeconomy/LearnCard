/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Email_Keysenttitle2Inputs */

const en_recovery_setup_email_keysenttitle2 = /** @type {(inputs: Recovery_Setup_Email_Keysenttitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery key sent`)
};

const es_recovery_setup_email_keysenttitle2 = /** @type {(inputs: Recovery_Setup_Email_Keysenttitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clave de recuperación enviada`)
};

const fr_recovery_setup_email_keysenttitle2 = /** @type {(inputs: Recovery_Setup_Email_Keysenttitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé de récupération envoyée`)
};

const ar_recovery_setup_email_keysenttitle2 = /** @type {(inputs: Recovery_Setup_Email_Keysenttitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery key sent`)
};

/**
* | output |
* | --- |
* | "Recovery key sent" |
*
* @param {Recovery_Setup_Email_Keysenttitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_keysenttitle2 = /** @type {((inputs?: Recovery_Setup_Email_Keysenttitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_Keysenttitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_keysenttitle2(inputs)
	if (locale === "es") return es_recovery_setup_email_keysenttitle2(inputs)
	if (locale === "fr") return fr_recovery_setup_email_keysenttitle2(inputs)
	return ar_recovery_setup_email_keysenttitle2(inputs)
});
export { recovery_setup_email_keysenttitle2 as "recovery.setup.email.keySentTitle" }