/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Issue1Inputs */

const en_admintools_issue1 = /** @type {(inputs: Admintools_Issue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue`)
};

const es_admintools_issue1 = /** @type {(inputs: Admintools_Issue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir`)
};

const fr_admintools_issue1 = /** @type {(inputs: Admintools_Issue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délivrer`)
};

const ar_admintools_issue1 = /** @type {(inputs: Admintools_Issue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار`)
};

/**
* | output |
* | --- |
* | "Issue" |
*
* @param {Admintools_Issue1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_issue1 = /** @type {((inputs?: Admintools_Issue1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Issue1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_issue1(inputs)
	if (locale === "es") return es_admintools_issue1(inputs)
	if (locale === "fr") return fr_admintools_issue1(inputs)
	return ar_admintools_issue1(inputs)
});
export { admintools_issue1 as "adminTools.issue" }