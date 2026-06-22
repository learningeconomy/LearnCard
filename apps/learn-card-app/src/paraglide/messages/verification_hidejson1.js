/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Verification_Hidejson1Inputs */

const en_verification_hidejson1 = /** @type {(inputs: Verification_Hidejson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hide json`)
};

const es_verification_hidejson1 = /** @type {(inputs: Verification_Hidejson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocultar json`)
};

const fr_verification_hidejson1 = /** @type {(inputs: Verification_Hidejson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Masquer json`)
};

const ar_verification_hidejson1 = /** @type {(inputs: Verification_Hidejson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إخفاء json`)
};

/**
* | output |
* | --- |
* | "Hide json" |
*
* @param {Verification_Hidejson1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const verification_hidejson1 = /** @type {((inputs?: Verification_Hidejson1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Verification_Hidejson1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_verification_hidejson1(inputs)
	if (locale === "es") return es_verification_hidejson1(inputs)
	if (locale === "fr") return fr_verification_hidejson1(inputs)
	return ar_verification_hidejson1(inputs)
});
export { verification_hidejson1 as "verification.hideJson" }