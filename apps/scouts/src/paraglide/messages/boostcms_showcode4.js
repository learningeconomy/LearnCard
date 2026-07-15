/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Showcode4Inputs */

const en_boostcms_showcode4 = /** @type {(inputs: Boostcms_Showcode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show Code`)
};

const es_boostcms_showcode4 = /** @type {(inputs: Boostcms_Showcode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar Código`)
};

const fr_boostcms_showcode4 = /** @type {(inputs: Boostcms_Showcode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher le code`)
};

const ar_boostcms_showcode4 = /** @type {(inputs: Boostcms_Showcode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إظهار الرمز`)
};

/**
* | output |
* | --- |
* | "Show Code" |
*
* @param {Boostcms_Showcode4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_showcode4 = /** @type {((inputs?: Boostcms_Showcode4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Showcode4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_showcode4(inputs)
	if (locale === "es") return es_boostcms_showcode4(inputs)
	if (locale === "fr") return fr_boostcms_showcode4(inputs)
	return ar_boostcms_showcode4(inputs)
});
export { boostcms_showcode4 as "boostCMS.showCode" }