/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Subtextsomeone1Inputs */

const en_boost_wizard_subtextsomeone1 = /** @type {(inputs: Boost_Wizard_Subtextsomeone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue boosts to people you know.`)
};

const es_boost_wizard_subtextsomeone1 = /** @type {(inputs: Boost_Wizard_Subtextsomeone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emite boosts a personas que conoces.`)
};

const fr_boost_wizard_subtextsomeone1 = /** @type {(inputs: Boost_Wizard_Subtextsomeone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délivrez des boosts à des personnes que vous connaissez.`)
};

const ar_boost_wizard_subtextsomeone1 = /** @type {(inputs: Boost_Wizard_Subtextsomeone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`امنح تعزيزات لأشخاص تعرفهم.`)
};

/**
* | output |
* | --- |
* | "Issue boosts to people you know." |
*
* @param {Boost_Wizard_Subtextsomeone1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_subtextsomeone1 = /** @type {((inputs?: Boost_Wizard_Subtextsomeone1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Subtextsomeone1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_subtextsomeone1(inputs)
	if (locale === "es") return es_boost_wizard_subtextsomeone1(inputs)
	if (locale === "fr") return fr_boost_wizard_subtextsomeone1(inputs)
	return ar_boost_wizard_subtextsomeone1(inputs)
});
export { boost_wizard_subtextsomeone1 as "boost.wizard.subtextSomeone" }