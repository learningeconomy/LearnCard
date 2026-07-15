/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Appearance3Inputs */

const en_boostcms_appearance3 = /** @type {(inputs: Boostcms_Appearance3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Appearance`)
};

const es_boostcms_appearance3 = /** @type {(inputs: Boostcms_Appearance3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apariencia`)
};

const fr_boostcms_appearance3 = /** @type {(inputs: Boostcms_Appearance3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apparence`)
};

const ar_boostcms_appearance3 = /** @type {(inputs: Boostcms_Appearance3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Appearance`)
};

/**
* | output |
* | --- |
* | "Appearance" |
*
* @param {Boostcms_Appearance3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_appearance3 = /** @type {((inputs?: Boostcms_Appearance3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Appearance3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_appearance3(inputs)
	if (locale === "es") return es_boostcms_appearance3(inputs)
	if (locale === "fr") return fr_boostcms_appearance3(inputs)
	return ar_boostcms_appearance3(inputs)
});
export { boostcms_appearance3 as "boostCMS.appearance" }