/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ email: NonNullable<unknown> }} Recovery_Setup_Email_Recoveryrow1Inputs */

const en_recovery_setup_email_recoveryrow1 = /** @type {(inputs: Recovery_Setup_Email_Recoveryrow1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Recovery email: ${i?.email}`)
};

const es_recovery_setup_email_recoveryrow1 = /** @type {(inputs: Recovery_Setup_Email_Recoveryrow1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Correo de recuperación: ${i?.email}`)
};

const fr_recovery_setup_email_recoveryrow1 = /** @type {(inputs: Recovery_Setup_Email_Recoveryrow1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`E-mail de récupération : ${i?.email}`)
};

const ar_recovery_setup_email_recoveryrow1 = /** @type {(inputs: Recovery_Setup_Email_Recoveryrow1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`البريد الإلكتروني للاسترداد: ${i?.email}`)
};

/**
* | output |
* | --- |
* | "Recovery email: {email}" |
*
* @param {Recovery_Setup_Email_Recoveryrow1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_recoveryrow1 = /** @type {((inputs: Recovery_Setup_Email_Recoveryrow1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_Recoveryrow1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_recoveryrow1(inputs)
	if (locale === "es") return es_recovery_setup_email_recoveryrow1(inputs)
	if (locale === "fr") return fr_recovery_setup_email_recoveryrow1(inputs)
	return ar_recovery_setup_email_recoveryrow1(inputs)
});
export { recovery_setup_email_recoveryrow1 as "recovery.setup.email.recoveryRow" }