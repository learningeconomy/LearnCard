/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_SingularInputs */

const en_recovery_method_singular = /** @type {(inputs: Recovery_Method_SingularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`method`)
};

const es_recovery_method_singular = /** @type {(inputs: Recovery_Method_SingularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`método`)
};

const fr_recovery_method_singular = /** @type {(inputs: Recovery_Method_SingularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`méthode`)
};

const ar_recovery_method_singular = /** @type {(inputs: Recovery_Method_SingularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طريقة`)
};

/**
* | output |
* | --- |
* | "method" |
*
* @param {Recovery_Method_SingularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_singular = /** @type {((inputs?: Recovery_Method_SingularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_SingularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_singular(inputs)
	if (locale === "es") return es_recovery_method_singular(inputs)
	if (locale === "fr") return fr_recovery_method_singular(inputs)
	return ar_recovery_method_singular(inputs)
});
export { recovery_method_singular as "recovery.method.singular" }