/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Email_Findkey1Inputs */

const en_recovery_email_findkey1 = /** @type {(inputs: Recovery_Email_Findkey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How to find your recovery key`)
};

const es_recovery_email_findkey1 = /** @type {(inputs: Recovery_Email_Findkey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cómo encontrar tu clave de recuperación`)
};

const fr_recovery_email_findkey1 = /** @type {(inputs: Recovery_Email_Findkey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment trouver votre clé de récupération`)
};

const ar_recovery_email_findkey1 = /** @type {(inputs: Recovery_Email_Findkey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كيفية العثور على مفتاح الاسترداد الخاص بك`)
};

/**
* | output |
* | --- |
* | "How to find your recovery key" |
*
* @param {Recovery_Email_Findkey1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_email_findkey1 = /** @type {((inputs?: Recovery_Email_Findkey1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Email_Findkey1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_email_findkey1(inputs)
	if (locale === "es") return es_recovery_email_findkey1(inputs)
	if (locale === "fr") return fr_recovery_email_findkey1(inputs)
	return ar_recovery_email_findkey1(inputs)
});
export { recovery_email_findkey1 as "recovery.email.findKey" }