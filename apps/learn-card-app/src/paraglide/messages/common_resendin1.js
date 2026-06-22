/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ seconds: NonNullable<unknown> }} Common_Resendin1Inputs */

const en_common_resendin1 = /** @type {(inputs: Common_Resendin1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Resend in ${i?.seconds}s`)
};

const es_common_resendin1 = /** @type {(inputs: Common_Resendin1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Reenviar en ${i?.seconds}s`)
};

const fr_common_resendin1 = /** @type {(inputs: Common_Resendin1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Renvoyer dans ${i?.seconds}s`)
};

const ar_common_resendin1 = /** @type {(inputs: Common_Resendin1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إعادة الإرسال خلال ${i?.seconds} ثانية`)
};

/**
* | output |
* | --- |
* | "Resend in {seconds}s" |
*
* @param {Common_Resendin1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_resendin1 = /** @type {((inputs: Common_Resendin1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Resendin1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_resendin1(inputs)
	if (locale === "es") return es_common_resendin1(inputs)
	if (locale === "fr") return fr_common_resendin1(inputs)
	return ar_common_resendin1(inputs)
});
export { common_resendin1 as "common.resendIn" }