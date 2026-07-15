/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_All3Inputs */

const en_boostcms_all3 = /** @type {(inputs: Boostcms_All3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All`)
};

const es_boostcms_all3 = /** @type {(inputs: Boostcms_All3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos`)
};

const fr_boostcms_all3 = /** @type {(inputs: Boostcms_All3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout`)
};

const ar_boostcms_all3 = /** @type {(inputs: Boostcms_All3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All`)
};

/**
* | output |
* | --- |
* | "All" |
*
* @param {Boostcms_All3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_all3 = /** @type {((inputs?: Boostcms_All3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_All3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_all3(inputs)
	if (locale === "es") return es_boostcms_all3(inputs)
	if (locale === "fr") return fr_boostcms_all3(inputs)
	return ar_boostcms_all3(inputs)
});
export { boostcms_all3 as "boostCMS.all" }