/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Whatwouldyoulike4Inputs */

const en_admintools_whatwouldyoulike4 = /** @type {(inputs: Admintools_Whatwouldyoulike4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What you would you like to do, O Admin?`)
};

const es_admintools_whatwouldyoulike4 = /** @type {(inputs: Admintools_Whatwouldyoulike4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Qué te gustaría hacer, Oh Admin?`)
};

const fr_admintools_whatwouldyoulike4 = /** @type {(inputs: Admintools_Whatwouldyoulike4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Que souhaitez-vous faire, ô Admin ?`)
};

const ar_admintools_whatwouldyoulike4 = /** @type {(inputs: Admintools_Whatwouldyoulike4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What you would you like to do, O Admin?`)
};

/**
* | output |
* | --- |
* | "What you would you like to do, O Admin?" |
*
* @param {Admintools_Whatwouldyoulike4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_whatwouldyoulike4 = /** @type {((inputs?: Admintools_Whatwouldyoulike4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Whatwouldyoulike4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_whatwouldyoulike4(inputs)
	if (locale === "es") return es_admintools_whatwouldyoulike4(inputs)
	if (locale === "fr") return fr_admintools_whatwouldyoulike4(inputs)
	return ar_admintools_whatwouldyoulike4(inputs)
});
export { admintools_whatwouldyoulike4 as "adminTools.whatWouldYouLike" }