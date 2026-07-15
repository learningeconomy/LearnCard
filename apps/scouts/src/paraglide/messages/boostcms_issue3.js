/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Issue3Inputs */

const en_boostcms_issue3 = /** @type {(inputs: Boostcms_Issue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue`)
};

const es_boostcms_issue3 = /** @type {(inputs: Boostcms_Issue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir`)
};

const fr_boostcms_issue3 = /** @type {(inputs: Boostcms_Issue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délivrer`)
};

const ar_boostcms_issue3 = /** @type {(inputs: Boostcms_Issue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار`)
};

/**
* | output |
* | --- |
* | "Issue" |
*
* @param {Boostcms_Issue3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_issue3 = /** @type {((inputs?: Boostcms_Issue3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Issue3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_issue3(inputs)
	if (locale === "es") return es_boostcms_issue3(inputs)
	if (locale === "fr") return fr_boostcms_issue3(inputs)
	return ar_boostcms_issue3(inputs)
});
export { boostcms_issue3 as "boostCMS.issue" }