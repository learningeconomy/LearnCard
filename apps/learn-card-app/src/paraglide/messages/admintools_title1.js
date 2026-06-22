/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Title1Inputs */

const en_admintools_title1 = /** @type {(inputs: Admintools_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Advanced Tools`)
};

const es_admintools_title1 = /** @type {(inputs: Admintools_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Herramientas avanzadas`)
};

const fr_admintools_title1 = /** @type {(inputs: Admintools_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Outils avancés`)
};

const ar_admintools_title1 = /** @type {(inputs: Admintools_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدوات متقدمة`)
};

/**
* | output |
* | --- |
* | "Advanced Tools" |
*
* @param {Admintools_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_title1 = /** @type {((inputs?: Admintools_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_title1(inputs)
	if (locale === "es") return es_admintools_title1(inputs)
	if (locale === "fr") return fr_admintools_title1(inputs)
	return ar_admintools_title1(inputs)
});
export { admintools_title1 as "adminTools.title" }