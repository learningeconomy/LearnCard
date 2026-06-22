/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Generatemagic1Inputs */

const en_boost_wizard_generatemagic1 = /** @type {(inputs: Boost_Wizard_Generatemagic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Magic`)
};

const es_boost_wizard_generatemagic1 = /** @type {(inputs: Boost_Wizard_Generatemagic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generar magia`)
};

const fr_boost_wizard_generatemagic1 = /** @type {(inputs: Boost_Wizard_Generatemagic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer la magie`)
};

const ar_boost_wizard_generatemagic1 = /** @type {(inputs: Boost_Wizard_Generatemagic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء السحر`)
};

/**
* | output |
* | --- |
* | "Generate Magic" |
*
* @param {Boost_Wizard_Generatemagic1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_generatemagic1 = /** @type {((inputs?: Boost_Wizard_Generatemagic1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Generatemagic1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_generatemagic1(inputs)
	if (locale === "es") return es_boost_wizard_generatemagic1(inputs)
	if (locale === "fr") return fr_boost_wizard_generatemagic1(inputs)
	return ar_boost_wizard_generatemagic1(inputs)
});
export { boost_wizard_generatemagic1 as "boost.wizard.generateMagic" }