/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_GeneratingInputs */

const en_boost_wizard_generating = /** @type {(inputs: Boost_Wizard_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating...`)
};

const es_boost_wizard_generating = /** @type {(inputs: Boost_Wizard_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generando...`)
};

const fr_boost_wizard_generating = /** @type {(inputs: Boost_Wizard_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération...`)
};

const ar_boost_wizard_generating = /** @type {(inputs: Boost_Wizard_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الإنشاء...`)
};

/**
* | output |
* | --- |
* | "Generating..." |
*
* @param {Boost_Wizard_GeneratingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_generating = /** @type {((inputs?: Boost_Wizard_GeneratingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_GeneratingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_generating(inputs)
	if (locale === "es") return es_boost_wizard_generating(inputs)
	if (locale === "fr") return fr_boost_wizard_generating(inputs)
	return ar_boost_wizard_generating(inputs)
});
export { boost_wizard_generating as "boost.wizard.generating" }