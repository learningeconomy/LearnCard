/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Confirmpassword1Inputs */

const en_recovery_confirmpassword1 = /** @type {(inputs: Recovery_Confirmpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirm Password`)
};

const es_recovery_confirmpassword1 = /** @type {(inputs: Recovery_Confirmpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmar contraseña`)
};

const fr_recovery_confirmpassword1 = /** @type {(inputs: Recovery_Confirmpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmer le mot de passe`)
};

const ar_recovery_confirmpassword1 = /** @type {(inputs: Recovery_Confirmpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تأكيد كلمة المرور`)
};

/**
* | output |
* | --- |
* | "Confirm Password" |
*
* @param {Recovery_Confirmpassword1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_confirmpassword1 = /** @type {((inputs?: Recovery_Confirmpassword1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Confirmpassword1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_confirmpassword1(inputs)
	if (locale === "es") return es_recovery_confirmpassword1(inputs)
	if (locale === "fr") return fr_recovery_confirmpassword1(inputs)
	return ar_recovery_confirmpassword1(inputs)
});
export { recovery_confirmpassword1 as "recovery.confirmPassword" }