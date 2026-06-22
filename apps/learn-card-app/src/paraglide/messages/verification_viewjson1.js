/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Verification_Viewjson1Inputs */

const en_verification_viewjson1 = /** @type {(inputs: Verification_Viewjson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View json`)
};

const es_verification_viewjson1 = /** @type {(inputs: Verification_Viewjson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver json`)
};

const fr_verification_viewjson1 = /** @type {(inputs: Verification_Viewjson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir json`)
};

const ar_verification_viewjson1 = /** @type {(inputs: Verification_Viewjson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض json`)
};

/**
* | output |
* | --- |
* | "View json" |
*
* @param {Verification_Viewjson1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const verification_viewjson1 = /** @type {((inputs?: Verification_Viewjson1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Verification_Viewjson1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_verification_viewjson1(inputs)
	if (locale === "es") return es_verification_viewjson1(inputs)
	if (locale === "fr") return fr_verification_viewjson1(inputs)
	return ar_verification_viewjson1(inputs)
});
export { verification_viewjson1 as "verification.viewJson" }