/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Emaildesc1Inputs */

const en_recovery_method_emaildesc1 = /** @type {(inputs: Recovery_Method_Emaildesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste the key sent to your email`)
};

const es_recovery_method_emaildesc1 = /** @type {(inputs: Recovery_Method_Emaildesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pega la clave enviada a tu correo`)
};

const de_recovery_method_emaildesc1 = /** @type {(inputs: Recovery_Method_Emaildesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Füge den per E-Mail gesendeten Schlüssel ein`)
};

const ar_recovery_method_emaildesc1 = /** @type {(inputs: Recovery_Method_Emaildesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصق المفتاح المرسل إلى بريدك`)
};

const fr_recovery_method_emaildesc1 = /** @type {(inputs: Recovery_Method_Emaildesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collez la clé envoyée à votre e-mail`)
};

const ko_recovery_method_emaildesc1 = /** @type {(inputs: Recovery_Method_Emaildesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이메일로 받은 키를 붙여넣기`)
};

/**
* | output |
* | --- |
* | "Paste the key sent to your email" |
*
* @param {Recovery_Method_Emaildesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_method_emaildesc1 = /** @type {((inputs?: Recovery_Method_Emaildesc1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Emaildesc1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_emaildesc1(inputs)
	if (locale === "es") return es_recovery_method_emaildesc1(inputs)
	if (locale === "de") return de_recovery_method_emaildesc1(inputs)
	if (locale === "ar") return ar_recovery_method_emaildesc1(inputs)
	if (locale === "fr") return fr_recovery_method_emaildesc1(inputs)
	return ko_recovery_method_emaildesc1(inputs)
});
export { recovery_method_emaildesc1 as "recovery.method.emailDesc" }