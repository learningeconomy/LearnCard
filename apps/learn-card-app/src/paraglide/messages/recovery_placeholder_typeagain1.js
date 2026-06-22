/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Placeholder_Typeagain1Inputs */

const en_recovery_placeholder_typeagain1 = /** @type {(inputs: Recovery_Placeholder_Typeagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type it again`)
};

const es_recovery_placeholder_typeagain1 = /** @type {(inputs: Recovery_Placeholder_Typeagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escríbela de nuevo`)
};

const fr_recovery_placeholder_typeagain1 = /** @type {(inputs: Recovery_Placeholder_Typeagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tapez-le à nouveau`)
};

const ar_recovery_placeholder_typeagain1 = /** @type {(inputs: Recovery_Placeholder_Typeagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكتبها مرة أخرى`)
};

/**
* | output |
* | --- |
* | "Type it again" |
*
* @param {Recovery_Placeholder_Typeagain1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_placeholder_typeagain1 = /** @type {((inputs?: Recovery_Placeholder_Typeagain1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Placeholder_Typeagain1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_placeholder_typeagain1(inputs)
	if (locale === "es") return es_recovery_placeholder_typeagain1(inputs)
	if (locale === "fr") return fr_recovery_placeholder_typeagain1(inputs)
	return ar_recovery_placeholder_typeagain1(inputs)
});
export { recovery_placeholder_typeagain1 as "recovery.placeholder.typeAgain" }