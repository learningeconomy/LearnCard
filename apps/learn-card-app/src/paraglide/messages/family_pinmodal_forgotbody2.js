/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pinmodal_Forgotbody2Inputs */

const en_family_pinmodal_forgotbody2 = /** @type {(inputs: Family_Pinmodal_Forgotbody2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Forgot your PIN? To update it, please ensure you've logged in recently to keep your account secure.`)
};

const es_family_pinmodal_forgotbody2 = /** @type {(inputs: Family_Pinmodal_Forgotbody2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Olvidaste tu PIN? Para actualizarlo, asegúrate de haber iniciado sesión recientemente para mantener tu cuenta segura.`)
};

const fr_family_pinmodal_forgotbody2 = /** @type {(inputs: Family_Pinmodal_Forgotbody2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez oublié votre PIN ? Pour le mettre à jour, assurez-vous de vous être connecté récemment afin de protéger votre compte.`)
};

const ar_family_pinmodal_forgotbody2 = /** @type {(inputs: Family_Pinmodal_Forgotbody2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل نسيت رقم التعريف الشخصي؟ لتحديثه، تأكد من أنك سجّلت الدخول مؤخرًا للحفاظ على أمان حسابك.`)
};

/**
* | output |
* | --- |
* | "Forgot your PIN? To update it, please ensure you've logged in recently to keep your account secure." |
*
* @param {Family_Pinmodal_Forgotbody2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pinmodal_forgotbody2 = /** @type {((inputs?: Family_Pinmodal_Forgotbody2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pinmodal_Forgotbody2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pinmodal_forgotbody2(inputs)
	if (locale === "es") return es_family_pinmodal_forgotbody2(inputs)
	if (locale === "fr") return fr_family_pinmodal_forgotbody2(inputs)
	return ar_family_pinmodal_forgotbody2(inputs)
});
export { family_pinmodal_forgotbody2 as "family.pinModal.forgotBody" }