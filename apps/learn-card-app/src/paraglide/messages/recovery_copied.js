/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_CopiedInputs */

const en_recovery_copied = /** @type {(inputs: Recovery_CopiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copied!`)
};

const es_recovery_copied = /** @type {(inputs: Recovery_CopiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Copiado!`)
};

const fr_recovery_copied = /** @type {(inputs: Recovery_CopiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copié !`)
};

const ar_recovery_copied = /** @type {(inputs: Recovery_CopiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم النسخ!`)
};

/**
* | output |
* | --- |
* | "Copied!" |
*
* @param {Recovery_CopiedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_copied = /** @type {((inputs?: Recovery_CopiedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_CopiedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_copied(inputs)
	if (locale === "es") return es_recovery_copied(inputs)
	if (locale === "fr") return fr_recovery_copied(inputs)
	return ar_recovery_copied(inputs)
});
export { recovery_copied as "recovery.copied" }