/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Email_Keyhint1Inputs */

const en_recovery_email_keyhint1 = /** @type {(inputs: Recovery_Email_Keyhint1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The key is a long string of letters and numbers. Copy and paste it exactly as it appears in the email.`)
};

const es_recovery_email_keyhint1 = /** @type {(inputs: Recovery_Email_Keyhint1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La clave es una cadena larga de letras y números. Cópiala y pégala exactamente como aparece en el correo.`)
};

const fr_recovery_email_keyhint1 = /** @type {(inputs: Recovery_Email_Keyhint1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La clé est une longue chaîne de lettres et de chiffres. Copiez-la et collez-la exactement comme elle apparaît dans l'e-mail.`)
};

const ar_recovery_email_keyhint1 = /** @type {(inputs: Recovery_Email_Keyhint1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المفتاح هو سلسلة طويلة من الأحرف والأرقام. انسخه والصقه تماماً كما يظهر في البريد الإلكتروني.`)
};

/**
* | output |
* | --- |
* | "The key is a long string of letters and numbers. Copy and paste it exactly as it appears in the email." |
*
* @param {Recovery_Email_Keyhint1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_email_keyhint1 = /** @type {((inputs?: Recovery_Email_Keyhint1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Email_Keyhint1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_email_keyhint1(inputs)
	if (locale === "es") return es_recovery_email_keyhint1(inputs)
	if (locale === "fr") return fr_recovery_email_keyhint1(inputs)
	return ar_recovery_email_keyhint1(inputs)
});
export { recovery_email_keyhint1 as "recovery.email.keyHint" }