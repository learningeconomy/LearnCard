/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Resendcode1Inputs */

const en_common_resendcode1 = /** @type {(inputs: Common_Resendcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resend Code`)
};

const es_common_resendcode1 = /** @type {(inputs: Common_Resendcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reenviar código`)
};

const fr_common_resendcode1 = /** @type {(inputs: Common_Resendcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renvoyer le code`)
};

const ar_common_resendcode1 = /** @type {(inputs: Common_Resendcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة إرسال الرمز`)
};

/**
* | output |
* | --- |
* | "Resend Code" |
*
* @param {Common_Resendcode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_resendcode1 = /** @type {((inputs?: Common_Resendcode1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Resendcode1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_resendcode1(inputs)
	if (locale === "es") return es_common_resendcode1(inputs)
	if (locale === "fr") return fr_common_resendcode1(inputs)
	return ar_common_resendcode1(inputs)
});
export { common_resendcode1 as "common.resendCode" }