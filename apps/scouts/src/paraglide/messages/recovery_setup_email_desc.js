/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Email_DescInputs */

const en_recovery_setup_email_desc = /** @type {(inputs: Recovery_Setup_Email_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a personal email (different from your login) as a recovery destination. A recovery key will be sent there.`)
};

const es_recovery_setup_email_desc = /** @type {(inputs: Recovery_Setup_Email_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añade un correo personal (diferente al de inicio de sesión) como destino de recuperación.`)
};

const fr_recovery_setup_email_desc = /** @type {(inputs: Recovery_Setup_Email_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez un e-mail personnel (différent de votre connexion) comme destination de récupération. Une clé de récupération y sera envoyée.`)
};

const ar_recovery_setup_email_desc = /** @type {(inputs: Recovery_Setup_Email_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف بريداً إلكترونياً شخصياً (مختلفاً عن بريد تسجيل الدخول) كوجهة للاسترداد. سيتم إرسال مفتاح استرداد إليه.`)
};

/**
* | output |
* | --- |
* | "Add a personal email (different from your login) as a recovery destination. A recovery key will be sent there." |
*
* @param {Recovery_Setup_Email_DescInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_desc = /** @type {((inputs?: Recovery_Setup_Email_DescInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_DescInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_desc(inputs)
	if (locale === "es") return es_recovery_setup_email_desc(inputs)
	if (locale === "fr") return fr_recovery_setup_email_desc(inputs)
	return ar_recovery_setup_email_desc(inputs)
});
export { recovery_setup_email_desc as "recovery.setup.email.desc" }