/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Approvefw2Inputs */

const en_skillframeworks_approvefw2 = /** @type {(inputs: Skillframeworks_Approvefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approve Framework`)
};

const es_skillframeworks_approvefw2 = /** @type {(inputs: Skillframeworks_Approvefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aprobar Marco`)
};

const fr_skillframeworks_approvefw2 = /** @type {(inputs: Skillframeworks_Approvefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approuver le cadre`)
};

const ar_skillframeworks_approvefw2 = /** @type {(inputs: Skillframeworks_Approvefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الموافقة على الإطار`)
};

/**
* | output |
* | --- |
* | "Approve Framework" |
*
* @param {Skillframeworks_Approvefw2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_approvefw2 = /** @type {((inputs?: Skillframeworks_Approvefw2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Approvefw2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_approvefw2(inputs)
	if (locale === "es") return es_skillframeworks_approvefw2(inputs)
	if (locale === "fr") return fr_skillframeworks_approvefw2(inputs)
	return ar_skillframeworks_approvefw2(inputs)
});
export { skillframeworks_approvefw2 as "skillFrameworks.approveFw" }