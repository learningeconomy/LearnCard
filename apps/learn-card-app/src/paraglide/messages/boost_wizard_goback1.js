/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Goback1Inputs */

const en_boost_wizard_goback1 = /** @type {(inputs: Boost_Wizard_Goback1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Go Back`)
};

const es_boost_wizard_goback1 = /** @type {(inputs: Boost_Wizard_Goback1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver`)
};

const fr_boost_wizard_goback1 = /** @type {(inputs: Boost_Wizard_Goback1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ar_boost_wizard_goback1 = /** @type {(inputs: Boost_Wizard_Goback1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

/**
* | output |
* | --- |
* | "Go Back" |
*
* @param {Boost_Wizard_Goback1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_goback1 = /** @type {((inputs?: Boost_Wizard_Goback1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Goback1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_goback1(inputs)
	if (locale === "es") return es_boost_wizard_goback1(inputs)
	if (locale === "fr") return fr_boost_wizard_goback1(inputs)
	return ar_boost_wizard_goback1(inputs)
});
export { boost_wizard_goback1 as "boost.wizard.goBack" }