/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ email: NonNullable<unknown> }} Recovery_Setup_Email_Keysentdesc2Inputs */

const en_recovery_setup_email_keysentdesc2 = /** @type {(inputs: Recovery_Setup_Email_Keysentdesc2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Check your inbox at ${i?.email}. Keep that email safe — you'll need the recovery key if you ever lose access.`)
};

const es_recovery_setup_email_keysentdesc2 = /** @type {(inputs: Recovery_Setup_Email_Keysentdesc2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Revisa tu bandeja en ${i?.email}. Guarda ese correo — necesitarás la clave si pierdes acceso.`)
};

const fr_recovery_setup_email_keysentdesc2 = /** @type {(inputs: Recovery_Setup_Email_Keysentdesc2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Vérifiez votre boîte de réception à ${i?.email}. Conservez cet e-mail — vous aurez besoin de la clé de récupération si vous perdez l'accès.`)
};

const ar_recovery_setup_email_keysentdesc2 = /** @type {(inputs: Recovery_Setup_Email_Keysentdesc2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تحقق من صندوق الوارد الخاص بك على ${i?.email}. احتفظ بهذا البريد الإلكتروني في مكان آمن — ستحتاج إلى مفتاح الاسترداد إذا فقدت الوصول.`)
};

/**
* | output |
* | --- |
* | "Check your inbox at {email}. Keep that email safe — you'll need the recovery key if you ever lose access." |
*
* @param {Recovery_Setup_Email_Keysentdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_keysentdesc2 = /** @type {((inputs: Recovery_Setup_Email_Keysentdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_Keysentdesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_keysentdesc2(inputs)
	if (locale === "es") return es_recovery_setup_email_keysentdesc2(inputs)
	if (locale === "fr") return fr_recovery_setup_email_keysentdesc2(inputs)
	return ar_recovery_setup_email_keysentdesc2(inputs)
});
export { recovery_setup_email_keysentdesc2 as "recovery.setup.email.keySentDesc" }