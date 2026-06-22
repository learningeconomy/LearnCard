/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_CreatingInputs */

const en_common_creating = /** @type {(inputs: Common_CreatingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creating...`)
};

const es_common_creating = /** @type {(inputs: Common_CreatingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creando...`)
};

const fr_common_creating = /** @type {(inputs: Common_CreatingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création...`)
};

const ar_common_creating = /** @type {(inputs: Common_CreatingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الإنشاء...`)
};

/**
* | output |
* | --- |
* | "Creating..." |
*
* @param {Common_CreatingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_creating = /** @type {((inputs?: Common_CreatingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_CreatingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_creating(inputs)
	if (locale === "es") return es_common_creating(inputs)
	if (locale === "fr") return fr_common_creating(inputs)
	return ar_common_creating(inputs)
});
export { common_creating as "common.creating" }