/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Worklife_Goodenough3Inputs */

const en_aipathways_worklife_goodenough3 = /** @type {(inputs: Aipathways_Worklife_Goodenough3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Good Enough`)
};

const es_aipathways_worklife_goodenough3 = /** @type {(inputs: Aipathways_Worklife_Goodenough3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Está Bien`)
};

const fr_aipathways_worklife_goodenough3 = /** @type {(inputs: Aipathways_Worklife_Goodenough3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`C'est assez bien`)
};

const ar_aipathways_worklife_goodenough3 = /** @type {(inputs: Aipathways_Worklife_Goodenough3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنه جيد بما فيه الكفاية`)
};

/**
* | output |
* | --- |
* | "Good Enough" |
*
* @param {Aipathways_Worklife_Goodenough3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_worklife_goodenough3 = /** @type {((inputs?: Aipathways_Worklife_Goodenough3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Worklife_Goodenough3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_worklife_goodenough3(inputs)
	if (locale === "es") return es_aipathways_worklife_goodenough3(inputs)
	if (locale === "fr") return fr_aipathways_worklife_goodenough3(inputs)
	return ar_aipathways_worklife_goodenough3(inputs)
});
export { aipathways_worklife_goodenough3 as "aiPathways.workLife.goodEnough" }