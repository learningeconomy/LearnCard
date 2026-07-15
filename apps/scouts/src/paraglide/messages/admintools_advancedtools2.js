/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Advancedtools2Inputs */

const en_admintools_advancedtools2 = /** @type {(inputs: Admintools_Advancedtools2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Advanced Tools`)
};

const es_admintools_advancedtools2 = /** @type {(inputs: Admintools_Advancedtools2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Herramientas Avanzadas`)
};

const fr_admintools_advancedtools2 = /** @type {(inputs: Admintools_Advancedtools2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Outils avancés`)
};

const ar_admintools_advancedtools2 = /** @type {(inputs: Admintools_Advancedtools2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Advanced Tools`)
};

/**
* | output |
* | --- |
* | "Advanced Tools" |
*
* @param {Admintools_Advancedtools2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_advancedtools2 = /** @type {((inputs?: Admintools_Advancedtools2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Advancedtools2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_advancedtools2(inputs)
	if (locale === "es") return es_admintools_advancedtools2(inputs)
	if (locale === "fr") return fr_admintools_advancedtools2(inputs)
	return ar_admintools_advancedtools2(inputs)
});
export { admintools_advancedtools2 as "adminTools.advancedTools" }