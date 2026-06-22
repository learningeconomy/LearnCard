/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Loadertext_81Inputs */

const en_boost_wizard_loadertext_81 = /** @type {(inputs: Boost_Wizard_Loadertext_81Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI is crafting your proof...`)
};

const es_boost_wizard_loadertext_81 = /** @type {(inputs: Boost_Wizard_Loadertext_81Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La IA está creando tu prueba...`)
};

const fr_boost_wizard_loadertext_81 = /** @type {(inputs: Boost_Wizard_Loadertext_81Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'IA élabore votre preuve...`)
};

const ar_boost_wizard_loadertext_81 = /** @type {(inputs: Boost_Wizard_Loadertext_81Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الذكاء الاصطناعي يصوغ إثباتك...`)
};

/**
* | output |
* | --- |
* | "AI is crafting your proof..." |
*
* @param {Boost_Wizard_Loadertext_81Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_loadertext_81 = /** @type {((inputs?: Boost_Wizard_Loadertext_81Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Loadertext_81Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_loadertext_81(inputs)
	if (locale === "es") return es_boost_wizard_loadertext_81(inputs)
	if (locale === "fr") return fr_boost_wizard_loadertext_81(inputs)
	return ar_boost_wizard_loadertext_81(inputs)
});
export { boost_wizard_loadertext_81 as "boost.wizard.loaderText.8" }