/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Emaildescription1Inputs */

const en_recovery_emaildescription1 = /** @type {(inputs: Recovery_Emaildescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a personal email (different from your login) as a recovery destination. A recovery key will be sent there.`)
};

const es_recovery_emaildescription1 = /** @type {(inputs: Recovery_Emaildescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agrega un correo personal (diferente al de inicio de sesión) como destino de recuperación. Se enviará una clave de recuperación allí.`)
};

const fr_recovery_emaildescription1 = /** @type {(inputs: Recovery_Emaildescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez un e-mail personnel (différent de votre identifiant) comme destination de récupération. Une clé de récupération y sera envoyée.`)
};

const ar_recovery_emaildescription1 = /** @type {(inputs: Recovery_Emaildescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف بريدًا إلكترونيًا شخصيًا (مختلف عن بريد تسجيل الدخول) كوجهة استرداد. سيتم إرسال مفتاح استرداد إليه.`)
};

/**
* | output |
* | --- |
* | "Add a personal email (different from your login) as a recovery destination. A recovery key will be sent there." |
*
* @param {Recovery_Emaildescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_emaildescription1 = /** @type {((inputs?: Recovery_Emaildescription1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Emaildescription1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_emaildescription1(inputs)
	if (locale === "es") return es_recovery_emaildescription1(inputs)
	if (locale === "fr") return fr_recovery_emaildescription1(inputs)
	return ar_recovery_emaildescription1(inputs)
});
export { recovery_emaildescription1 as "recovery.emailDescription" }