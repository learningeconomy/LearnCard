/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Publishing3Inputs */

const en_boostcms_publishing3 = /** @type {(inputs: Boostcms_Publishing3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publishing...`)
};

const es_boostcms_publishing3 = /** @type {(inputs: Boostcms_Publishing3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publicando...`)
};

const fr_boostcms_publishing3 = /** @type {(inputs: Boostcms_Publishing3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publication en cours...`)
};

const ar_boostcms_publishing3 = /** @type {(inputs: Boostcms_Publishing3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publishing...`)
};

/**
* | output |
* | --- |
* | "Publishing..." |
*
* @param {Boostcms_Publishing3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_publishing3 = /** @type {((inputs?: Boostcms_Publishing3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Publishing3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_publishing3(inputs)
	if (locale === "es") return es_boostcms_publishing3(inputs)
	if (locale === "fr") return fr_boostcms_publishing3(inputs)
	return ar_boostcms_publishing3(inputs)
});
export { boostcms_publishing3 as "boostCMS.publishing" }