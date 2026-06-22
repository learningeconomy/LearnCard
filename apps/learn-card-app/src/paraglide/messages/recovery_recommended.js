/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_RecommendedInputs */

const en_recovery_recommended = /** @type {(inputs: Recovery_RecommendedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommended`)
};

const es_recovery_recommended = /** @type {(inputs: Recovery_RecommendedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recomendado`)
};

const fr_recovery_recommended = /** @type {(inputs: Recovery_RecommendedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommandé`)
};

const ar_recovery_recommended = /** @type {(inputs: Recovery_RecommendedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موصى به`)
};

/**
* | output |
* | --- |
* | "Recommended" |
*
* @param {Recovery_RecommendedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_recommended = /** @type {((inputs?: Recovery_RecommendedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_RecommendedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_recommended(inputs)
	if (locale === "es") return es_recovery_recommended(inputs)
	if (locale === "fr") return fr_recovery_recommended(inputs)
	return ar_recovery_recommended(inputs)
});
export { recovery_recommended as "recovery.recommended" }