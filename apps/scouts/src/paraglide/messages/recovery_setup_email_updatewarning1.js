/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Email_Updatewarning1Inputs */

const en_recovery_setup_email_updatewarning1 = /** @type {(inputs: Recovery_Setup_Email_Updatewarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This will replace your current recovery email.`)
};

const es_recovery_setup_email_updatewarning1 = /** @type {(inputs: Recovery_Setup_Email_Updatewarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esto reemplazará tu correo de recuperación actual.`)
};

const fr_recovery_setup_email_updatewarning1 = /** @type {(inputs: Recovery_Setup_Email_Updatewarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela remplacera votre adresse e-mail de récupération actuelle.`)
};

const ar_recovery_setup_email_updatewarning1 = /** @type {(inputs: Recovery_Setup_Email_Updatewarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This will replace your current recovery email.`)
};

/**
* | output |
* | --- |
* | "This will replace your current recovery email." |
*
* @param {Recovery_Setup_Email_Updatewarning1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_updatewarning1 = /** @type {((inputs?: Recovery_Setup_Email_Updatewarning1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_Updatewarning1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_updatewarning1(inputs)
	if (locale === "es") return es_recovery_setup_email_updatewarning1(inputs)
	if (locale === "fr") return fr_recovery_setup_email_updatewarning1(inputs)
	return ar_recovery_setup_email_updatewarning1(inputs)
});
export { recovery_setup_email_updatewarning1 as "recovery.setup.email.updateWarning" }