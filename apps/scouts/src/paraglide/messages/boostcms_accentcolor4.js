/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Accentcolor4Inputs */

const en_boostcms_accentcolor4 = /** @type {(inputs: Boostcms_Accentcolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accent Color`)
};

const es_boostcms_accentcolor4 = /** @type {(inputs: Boostcms_Accentcolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color de Acento`)
};

const fr_boostcms_accentcolor4 = /** @type {(inputs: Boostcms_Accentcolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couleur d'accent`)
};

const ar_boostcms_accentcolor4 = /** @type {(inputs: Boostcms_Accentcolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لون التمييز`)
};

/**
* | output |
* | --- |
* | "Accent Color" |
*
* @param {Boostcms_Accentcolor4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_accentcolor4 = /** @type {((inputs?: Boostcms_Accentcolor4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Accentcolor4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_accentcolor4(inputs)
	if (locale === "es") return es_boostcms_accentcolor4(inputs)
	if (locale === "fr") return fr_boostcms_accentcolor4(inputs)
	return ar_boostcms_accentcolor4(inputs)
});
export { boostcms_accentcolor4 as "boostCMS.accentColor" }