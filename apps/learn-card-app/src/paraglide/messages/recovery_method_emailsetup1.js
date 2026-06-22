/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Emailsetup1Inputs */

const en_recovery_method_emailsetup1 = /** @type {(inputs: Recovery_Method_Emailsetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email recovery is set up`)
};

const es_recovery_method_emailsetup1 = /** @type {(inputs: Recovery_Method_Emailsetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recuperación por correo configurada`)
};

const fr_recovery_method_emailsetup1 = /** @type {(inputs: Recovery_Method_Emailsetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupération par e-mail configurée`)
};

const ar_recovery_method_emailsetup1 = /** @type {(inputs: Recovery_Method_Emailsetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إعداد الاستعادة عبر البريد`)
};

/**
* | output |
* | --- |
* | "Email recovery is set up" |
*
* @param {Recovery_Method_Emailsetup1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_emailsetup1 = /** @type {((inputs?: Recovery_Method_Emailsetup1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Emailsetup1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_emailsetup1(inputs)
	if (locale === "es") return es_recovery_method_emailsetup1(inputs)
	if (locale === "fr") return fr_recovery_method_emailsetup1(inputs)
	return ar_recovery_method_emailsetup1(inputs)
});
export { recovery_method_emailsetup1 as "recovery.method.emailSetup" }