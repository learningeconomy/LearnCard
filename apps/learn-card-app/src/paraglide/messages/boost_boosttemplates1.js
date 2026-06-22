/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Boosttemplates1Inputs */

const en_boost_boosttemplates1 = /** @type {(inputs: Boost_Boosttemplates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Templates`)
};

const es_boost_boosttemplates1 = /** @type {(inputs: Boost_Boosttemplates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plantillas de Boost`)
};

const fr_boost_boosttemplates1 = /** @type {(inputs: Boost_Boosttemplates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèles de Boost`)
};

const ar_boost_boosttemplates1 = /** @type {(inputs: Boost_Boosttemplates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قوالب الترقيات`)
};

/**
* | output |
* | --- |
* | "Boost Templates" |
*
* @param {Boost_Boosttemplates1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_boosttemplates1 = /** @type {((inputs?: Boost_Boosttemplates1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Boosttemplates1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_boosttemplates1(inputs)
	if (locale === "es") return es_boost_boosttemplates1(inputs)
	if (locale === "fr") return fr_boost_boosttemplates1(inputs)
	return ar_boost_boosttemplates1(inputs)
});
export { boost_boosttemplates1 as "boost.boostTemplates" }