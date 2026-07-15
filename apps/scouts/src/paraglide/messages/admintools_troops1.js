/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Troops1Inputs */

const en_admintools_troops1 = /** @type {(inputs: Admintools_Troops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troops`)
};

const es_admintools_troops1 = /** @type {(inputs: Admintools_Troops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troops`)
};

const fr_admintools_troops1 = /** @type {(inputs: Admintools_Troops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troupes`)
};

const ar_admintools_troops1 = /** @type {(inputs: Admintools_Troops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الفرق`)
};

/**
* | output |
* | --- |
* | "Troops" |
*
* @param {Admintools_Troops1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_troops1 = /** @type {((inputs?: Admintools_Troops1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Troops1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_troops1(inputs)
	if (locale === "es") return es_admintools_troops1(inputs)
	if (locale === "fr") return fr_admintools_troops1(inputs)
	return ar_admintools_troops1(inputs)
});
export { admintools_troops1 as "adminTools.troops" }