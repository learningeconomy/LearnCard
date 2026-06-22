/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_TitleInputs */

const en_boost_wizard_title = /** @type {(inputs: Boost_Wizard_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Boost Wizard`)
};

const es_boost_wizard_title = /** @type {(inputs: Boost_Wizard_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asistente de Boost con IA`)
};

const fr_boost_wizard_title = /** @type {(inputs: Boost_Wizard_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assistant Boost IA`)
};

const ar_boost_wizard_title = /** @type {(inputs: Boost_Wizard_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معالج التعزيز بالذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Boost Wizard" |
*
* @param {Boost_Wizard_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_title = /** @type {((inputs?: Boost_Wizard_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_title(inputs)
	if (locale === "es") return es_boost_wizard_title(inputs)
	if (locale === "fr") return fr_boost_wizard_title(inputs)
	return ar_boost_wizard_title(inputs)
});
export { boost_wizard_title as "boost.wizard.title" }