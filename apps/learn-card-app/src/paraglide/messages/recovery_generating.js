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

const de_recovery_generating = /** @type {(inputs: Recovery_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird generiert...`)
};

const ar_recovery_generating = /** @type {(inputs: Recovery_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التوليد...`)
};

const fr_recovery_generating = /** @type {(inputs: Recovery_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération...`)
};

const ko_recovery_generating = /** @type {(inputs: Recovery_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`생성 중...`)
};

/**
* | output |
* | --- |
* | "Generating..." |
*
* @param {Recovery_GeneratingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_generating = /** @type {((inputs?: Recovery_GeneratingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_GeneratingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_generating(inputs)
	if (locale === "es") return es_recovery_generating(inputs)
	if (locale === "de") return de_recovery_generating(inputs)
	if (locale === "ar") return ar_recovery_generating(inputs)
	if (locale === "fr") return fr_recovery_generating(inputs)
	return ko_recovery_generating(inputs)
});
export { recovery_generating as "recovery.generating" }