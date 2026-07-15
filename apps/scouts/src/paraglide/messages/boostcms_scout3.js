/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Scout3Inputs */

const en_boostcms_scout3 = /** @type {(inputs: Boostcms_Scout3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const es_boostcms_scout3 = /** @type {(inputs: Boostcms_Scout3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const fr_boostcms_scout3 = /** @type {(inputs: Boostcms_Scout3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const ar_boostcms_scout3 = /** @type {(inputs: Boostcms_Scout3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كشاف`)
};

/**
* | output |
* | --- |
* | "Scout" |
*
* @param {Boostcms_Scout3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_scout3 = /** @type {((inputs?: Boostcms_Scout3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Scout3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_scout3(inputs)
	if (locale === "es") return es_boostcms_scout3(inputs)
	if (locale === "fr") return fr_boostcms_scout3(inputs)
	return ar_boostcms_scout3(inputs)
});
export { boostcms_scout3 as "boostCMS.scout" }