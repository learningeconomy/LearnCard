/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ email: NonNullable<unknown> }} Recovery_Recoverykeysentdesc3Inputs */

const en_recovery_recoverykeysentdesc3 = /** @type {(inputs: Recovery_Recoverykeysentdesc3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Check your inbox at ${i?.email}. Keep that email safe — you'll need the recovery key if you ever lose access.`)
};

const es_recovery_recoverykeysentdesc3 = /** @type {(inputs: Recovery_Recoverykeysentdesc3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Revisa tu bandeja de entrada en ${i?.email}. Guarda ese correo — necesitarás la clave de recuperación si alguna vez pierdes acceso.`)
};

const fr_recovery_recoverykeysentdesc3 = /** @type {(inputs: Recovery_Recoverykeysentdesc3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Vérifiez votre boîte de réception à ${i?.email}. Gardez cet e-mail en sécurité — vous aurez besoin de la clé de récupération si vous perdez l'accès.`)
};

const ar_recovery_recoverykeysentdesc3 = /** @type {(inputs: Recovery_Recoverykeysentdesc3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تحقق من بريدك الوارد على ${i?.email}. احتفظ بذلك البريد بشكل آمن — ستحتاج مفتاح الاسترداد إذا فقدت الوصول يومًا ما.`)
};

/**
* | output |
* | --- |
* | "Check your inbox at {email}. Keep that email safe — you'll need the recovery key if you ever lose access." |
*
* @param {Recovery_Recoverykeysentdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_recoverykeysentdesc3 = /** @type {((inputs: Recovery_Recoverykeysentdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Recoverykeysentdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_recoverykeysentdesc3(inputs)
	if (locale === "es") return es_recovery_recoverykeysentdesc3(inputs)
	if (locale === "fr") return fr_recovery_recoverykeysentdesc3(inputs)
	return ar_recovery_recoverykeysentdesc3(inputs)
});
export { recovery_recoverykeysentdesc3 as "recovery.recoveryKeySentDesc" }