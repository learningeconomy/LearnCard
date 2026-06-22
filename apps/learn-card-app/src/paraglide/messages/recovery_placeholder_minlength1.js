/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Placeholder_Minlength1Inputs */

const en_recovery_placeholder_minlength1 = /** @type {(inputs: Recovery_Placeholder_Minlength1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`At least 8 characters`)
};

const es_recovery_placeholder_minlength1 = /** @type {(inputs: Recovery_Placeholder_Minlength1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Al menos 8 caracteres`)
};

const fr_recovery_placeholder_minlength1 = /** @type {(inputs: Recovery_Placeholder_Minlength1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Au moins 8 caractères`)
};

const ar_recovery_placeholder_minlength1 = /** @type {(inputs: Recovery_Placeholder_Minlength1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`8 أحرف على الأقل`)
};

/**
* | output |
* | --- |
* | "At least 8 characters" |
*
* @param {Recovery_Placeholder_Minlength1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_placeholder_minlength1 = /** @type {((inputs?: Recovery_Placeholder_Minlength1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Placeholder_Minlength1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_placeholder_minlength1(inputs)
	if (locale === "es") return es_recovery_placeholder_minlength1(inputs)
	if (locale === "fr") return fr_recovery_placeholder_minlength1(inputs)
	return ar_recovery_placeholder_minlength1(inputs)
});
export { recovery_placeholder_minlength1 as "recovery.placeholder.minLength" }