/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Default3Inputs */

const en_boostcms_default3 = /** @type {(inputs: Boostcms_Default3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Default`)
};

const es_boostcms_default3 = /** @type {(inputs: Boostcms_Default3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Predeterminado`)
};

const fr_boostcms_default3 = /** @type {(inputs: Boostcms_Default3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Par défaut`)
};

const ar_boostcms_default3 = /** @type {(inputs: Boostcms_Default3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`افتراضي`)
};

/**
* | output |
* | --- |
* | "Default" |
*
* @param {Boostcms_Default3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_default3 = /** @type {((inputs?: Boostcms_Default3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Default3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_default3(inputs)
	if (locale === "es") return es_boostcms_default3(inputs)
	if (locale === "fr") return fr_boostcms_default3(inputs)
	return ar_boostcms_default3(inputs)
});
export { boostcms_default3 as "boostCMS.default" }