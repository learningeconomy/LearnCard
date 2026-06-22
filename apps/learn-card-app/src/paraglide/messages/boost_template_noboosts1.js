/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Template_Noboosts1Inputs */

const en_boost_template_noboosts1 = /** @type {(inputs: Boost_Template_Noboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Boosts yet!`)
};

const es_boost_template_noboosts1 = /** @type {(inputs: Boost_Template_Noboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Aún no hay boosts!`)
};

const fr_boost_template_noboosts1 = /** @type {(inputs: Boost_Template_Noboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun boost pour le moment !`)
};

const ar_boost_template_noboosts1 = /** @type {(inputs: Boost_Template_Noboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد تعزيزات بعد!`)
};

/**
* | output |
* | --- |
* | "No Boosts yet!" |
*
* @param {Boost_Template_Noboosts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_template_noboosts1 = /** @type {((inputs?: Boost_Template_Noboosts1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Template_Noboosts1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_template_noboosts1(inputs)
	if (locale === "es") return es_boost_template_noboosts1(inputs)
	if (locale === "fr") return fr_boost_template_noboosts1(inputs)
	return ar_boost_template_noboosts1(inputs)
});
export { boost_template_noboosts1 as "boost.template.noBoosts" }