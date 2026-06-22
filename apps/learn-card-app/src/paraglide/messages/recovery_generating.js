/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_GeneratingInputs */

const en_recovery_generating = /** @type {(inputs: Recovery_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating...`)
};

const es_recovery_generating = /** @type {(inputs: Recovery_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generando...`)
};

const fr_recovery_generating = /** @type {(inputs: Recovery_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération...`)
};

const ar_recovery_generating = /** @type {(inputs: Recovery_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التوليد...`)
};

/**
* | output |
* | --- |
* | "Generating..." |
*
* @param {Recovery_GeneratingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_generating = /** @type {((inputs?: Recovery_GeneratingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_GeneratingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_generating(inputs)
	if (locale === "es") return es_recovery_generating(inputs)
	if (locale === "fr") return fr_recovery_generating(inputs)
	return ar_recovery_generating(inputs)
});
export { recovery_generating as "recovery.generating" }