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

const fr_recovery_method_emaildesc1 = /** @type {(inputs: Recovery_Method_Emaildesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collez la clé envoyée à votre adresse e-mail`)
};

const ar_recovery_method_emaildesc1 = /** @type {(inputs: Recovery_Method_Emaildesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste the key sent to your email`)
};

/**
* | output |
* | --- |
* | "Paste the key sent to your email" |
*
* @param {Recovery_Method_Emaildesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_emaildesc1 = /** @type {((inputs?: Recovery_Method_Emaildesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Emaildesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_emaildesc1(inputs)
	if (locale === "es") return es_recovery_method_emaildesc1(inputs)
	if (locale === "fr") return fr_recovery_method_emaildesc1(inputs)
	return ar_recovery_method_emaildesc1(inputs)
});
export { recovery_method_emaildesc1 as "recovery.method.emailDesc" }