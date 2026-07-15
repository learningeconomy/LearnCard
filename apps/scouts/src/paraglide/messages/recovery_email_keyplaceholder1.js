/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Email_Keyplaceholder1Inputs */

const en_recovery_email_keyplaceholder1 = /** @type {(inputs: Recovery_Email_Keyplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste your recovery key here — it looks like a long string of letters and numbers`)
};

const es_recovery_email_keyplaceholder1 = /** @type {(inputs: Recovery_Email_Keyplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pega tu clave de recuperación aquí — parece una cadena larga de letras y números`)
};

const fr_recovery_email_keyplaceholder1 = /** @type {(inputs: Recovery_Email_Keyplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collez votre clé de récupération ici — elle ressemble à une longue chaîne de lettres et de chiffres`)
};

const ar_recovery_email_keyplaceholder1 = /** @type {(inputs: Recovery_Email_Keyplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصق مفتاح الاسترداد هنا — يبدو كسلسلة طويلة من الأحرف والأرقام`)
};

/**
* | output |
* | --- |
* | "Paste your recovery key here — it looks like a long string of letters and numbers" |
*
* @param {Recovery_Email_Keyplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_email_keyplaceholder1 = /** @type {((inputs?: Recovery_Email_Keyplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Email_Keyplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_email_keyplaceholder1(inputs)
	if (locale === "es") return es_recovery_email_keyplaceholder1(inputs)
	if (locale === "fr") return fr_recovery_email_keyplaceholder1(inputs)
	return ar_recovery_email_keyplaceholder1(inputs)
});
export { recovery_email_keyplaceholder1 as "recovery.email.keyPlaceholder" }