/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Describeplaceholder1Inputs */

const en_boost_wizard_describeplaceholder1 = /** @type {(inputs: Boost_Wizard_Describeplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe the boost you want to make.`)
};

const es_boost_wizard_describeplaceholder1 = /** @type {(inputs: Boost_Wizard_Describeplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe el boost que quieres crear.`)
};

const fr_boost_wizard_describeplaceholder1 = /** @type {(inputs: Boost_Wizard_Describeplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Décrivez le boost que vous souhaitez créer.`)
};

const ar_boost_wizard_describeplaceholder1 = /** @type {(inputs: Boost_Wizard_Describeplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صف التعزيز الذي تريد إنشاءه.`)
};

/**
* | output |
* | --- |
* | "Describe the boost you want to make." |
*
* @param {Boost_Wizard_Describeplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_describeplaceholder1 = /** @type {((inputs?: Boost_Wizard_Describeplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Describeplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_describeplaceholder1(inputs)
	if (locale === "es") return es_boost_wizard_describeplaceholder1(inputs)
	if (locale === "fr") return fr_boost_wizard_describeplaceholder1(inputs)
	return ar_boost_wizard_describeplaceholder1(inputs)
});
export { boost_wizard_describeplaceholder1 as "boost.wizard.describePlaceholder" }