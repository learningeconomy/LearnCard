/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_PluralInputs */

const en_recovery_method_plural = /** @type {(inputs: Recovery_Method_PluralInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`methods`)
};

const es_recovery_method_plural = /** @type {(inputs: Recovery_Method_PluralInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`métodos`)
};

const fr_recovery_method_plural = /** @type {(inputs: Recovery_Method_PluralInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`méthodes`)
};

const ar_recovery_method_plural = /** @type {(inputs: Recovery_Method_PluralInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طرق`)
};

/**
* | output |
* | --- |
* | "methods" |
*
* @param {Recovery_Method_PluralInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_plural = /** @type {((inputs?: Recovery_Method_PluralInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_PluralInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_plural(inputs)
	if (locale === "es") return es_recovery_method_plural(inputs)
	if (locale === "fr") return fr_recovery_method_plural(inputs)
	return ar_recovery_method_plural(inputs)
});
export { recovery_method_plural as "recovery.method.plural" }