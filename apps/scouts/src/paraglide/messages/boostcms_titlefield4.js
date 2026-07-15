/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Titlefield4Inputs */

const en_boostcms_titlefield4 = /** @type {(inputs: Boostcms_Titlefield4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Title`)
};

const es_boostcms_titlefield4 = /** @type {(inputs: Boostcms_Titlefield4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Título`)
};

const fr_boostcms_titlefield4 = /** @type {(inputs: Boostcms_Titlefield4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titre`)
};

const ar_boostcms_titlefield4 = /** @type {(inputs: Boostcms_Titlefield4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Title`)
};

/**
* | output |
* | --- |
* | "Title" |
*
* @param {Boostcms_Titlefield4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_titlefield4 = /** @type {((inputs?: Boostcms_Titlefield4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Titlefield4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_titlefield4(inputs)
	if (locale === "es") return es_boostcms_titlefield4(inputs)
	if (locale === "fr") return fr_boostcms_titlefield4(inputs)
	return ar_boostcms_titlefield4(inputs)
});
export { boostcms_titlefield4 as "boostCMS.titleField" }