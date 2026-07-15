/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Boostfailed4Inputs */

const en_boostcms_boostfailed4 = /** @type {(inputs: Boostcms_Boostfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to save boost`)
};

const es_boostcms_boostfailed4 = /** @type {(inputs: Boostcms_Boostfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo guardar el boost`)
};

const fr_boostcms_boostfailed4 = /** @type {(inputs: Boostcms_Boostfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de sauvegarder le Boost`)
};

const ar_boostcms_boostfailed4 = /** @type {(inputs: Boostcms_Boostfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to save boost`)
};

/**
* | output |
* | --- |
* | "Unable to save boost" |
*
* @param {Boostcms_Boostfailed4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_boostfailed4 = /** @type {((inputs?: Boostcms_Boostfailed4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Boostfailed4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_boostfailed4(inputs)
	if (locale === "es") return es_boostcms_boostfailed4(inputs)
	if (locale === "fr") return fr_boostcms_boostfailed4(inputs)
	return ar_boostcms_boostfailed4(inputs)
});
export { boostcms_boostfailed4 as "boostCMS.boostFailed" }