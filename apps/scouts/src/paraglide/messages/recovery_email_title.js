/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Email_TitleInputs */

const en_recovery_email_title = /** @type {(inputs: Recovery_Email_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recover via Email`)
};

const es_recovery_email_title = /** @type {(inputs: Recovery_Email_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recuperar vía Correo`)
};

const fr_recovery_email_title = /** @type {(inputs: Recovery_Email_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupérer par e-mail`)
};

const ar_recovery_email_title = /** @type {(inputs: Recovery_Email_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاسترداد عبر البريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Recover via Email" |
*
* @param {Recovery_Email_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_email_title = /** @type {((inputs?: Recovery_Email_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Email_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_email_title(inputs)
	if (locale === "es") return es_recovery_email_title(inputs)
	if (locale === "fr") return fr_recovery_email_title(inputs)
	return ar_recovery_email_title(inputs)
});
export { recovery_email_title as "recovery.email.title" }