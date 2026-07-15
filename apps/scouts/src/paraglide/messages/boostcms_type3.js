/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Type3Inputs */

const en_boostcms_type3 = /** @type {(inputs: Boostcms_Type3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type`)
};

const es_boostcms_type3 = /** @type {(inputs: Boostcms_Type3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tipo`)
};

const fr_boostcms_type3 = /** @type {(inputs: Boostcms_Type3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type`)
};

const ar_boostcms_type3 = /** @type {(inputs: Boostcms_Type3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النوع`)
};

/**
* | output |
* | --- |
* | "Type" |
*
* @param {Boostcms_Type3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_type3 = /** @type {((inputs?: Boostcms_Type3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Type3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_type3(inputs)
	if (locale === "es") return es_boostcms_type3(inputs)
	if (locale === "fr") return fr_boostcms_type3(inputs)
	return ar_boostcms_type3(inputs)
});
export { boostcms_type3 as "boostCMS.type" }