/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Generateboost1Inputs */

const en_boost_wizard_generateboost1 = /** @type {(inputs: Boost_Wizard_Generateboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Boost`)
};

const es_boost_wizard_generateboost1 = /** @type {(inputs: Boost_Wizard_Generateboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generar boost`)
};

const fr_boost_wizard_generateboost1 = /** @type {(inputs: Boost_Wizard_Generateboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer le boost`)
};

const ar_boost_wizard_generateboost1 = /** @type {(inputs: Boost_Wizard_Generateboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء تعزيز`)
};

/**
* | output |
* | --- |
* | "Generate Boost" |
*
* @param {Boost_Wizard_Generateboost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_generateboost1 = /** @type {((inputs?: Boost_Wizard_Generateboost1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Generateboost1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_generateboost1(inputs)
	if (locale === "es") return es_boost_wizard_generateboost1(inputs)
	if (locale === "fr") return fr_boost_wizard_generateboost1(inputs)
	return ar_boost_wizard_generateboost1(inputs)
});
export { boost_wizard_generateboost1 as "boost.wizard.generateBoost" }