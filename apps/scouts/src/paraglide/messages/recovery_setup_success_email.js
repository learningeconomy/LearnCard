/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Success_EmailInputs */

const en_recovery_setup_success_email = /** @type {(inputs: Recovery_Setup_Success_EmailInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery key sent to your email!`)
};

const es_recovery_setup_success_email = /** @type {(inputs: Recovery_Setup_Success_EmailInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Clave de recuperación enviada a tu correo!`)
};

const fr_recovery_setup_success_email = /** @type {(inputs: Recovery_Setup_Success_EmailInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé de récupération envoyée à votre e-mail !`)
};

const ar_recovery_setup_success_email = /** @type {(inputs: Recovery_Setup_Success_EmailInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال مفتاح الاسترداد إلى بريدك الإلكتروني!`)
};

/**
* | output |
* | --- |
* | "Recovery key sent to your email!" |
*
* @param {Recovery_Setup_Success_EmailInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_success_email = /** @type {((inputs?: Recovery_Setup_Success_EmailInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Success_EmailInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_success_email(inputs)
	if (locale === "es") return es_recovery_setup_success_email(inputs)
	if (locale === "fr") return fr_recovery_setup_success_email(inputs)
	return ar_recovery_setup_success_email(inputs)
});
export { recovery_setup_success_email as "recovery.setup.success.email" }