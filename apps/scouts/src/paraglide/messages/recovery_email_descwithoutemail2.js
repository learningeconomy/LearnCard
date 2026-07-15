/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Email_Descwithoutemail2Inputs */

const en_recovery_email_descwithoutemail2 = /** @type {(inputs: Recovery_Email_Descwithoutemail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We previously sent a recovery email to your recovery address. Open that email and follow the steps below.`)
};

const es_recovery_email_descwithoutemail2 = /** @type {(inputs: Recovery_Email_Descwithoutemail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anteriormente enviamos un correo de recuperación a tu dirección de recuperación. Abre ese correo y sigue los pasos a continuación.`)
};

const fr_recovery_email_descwithoutemail2 = /** @type {(inputs: Recovery_Email_Descwithoutemail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous avons précédemment envoyé un e-mail de récupération à votre adresse de récupération. Ouvrez cet e-mail et suivez les étapes ci-dessous.`)
};

const ar_recovery_email_descwithoutemail2 = /** @type {(inputs: Recovery_Email_Descwithoutemail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد أرسلنا سابقاً بريداً إلكترونياً لاستعادة الحساب إلى عنوان الاسترداد الخاص بك. افتح ذلك البريد واتبع الخطوات أدناه.`)
};

/**
* | output |
* | --- |
* | "We previously sent a recovery email to your recovery address. Open that email and follow the steps below." |
*
* @param {Recovery_Email_Descwithoutemail2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_email_descwithoutemail2 = /** @type {((inputs?: Recovery_Email_Descwithoutemail2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Email_Descwithoutemail2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_email_descwithoutemail2(inputs)
	if (locale === "es") return es_recovery_email_descwithoutemail2(inputs)
	if (locale === "fr") return fr_recovery_email_descwithoutemail2(inputs)
	return ar_recovery_email_descwithoutemail2(inputs)
});
export { recovery_email_descwithoutemail2 as "recovery.email.descWithoutEmail" }