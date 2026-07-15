/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Meritbadges_Title1Inputs */

const en_meritbadges_title1 = /** @type {(inputs: Meritbadges_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Merit Badges`)
};

const es_meritbadges_title1 = /** @type {(inputs: Meritbadges_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignias de Mérito`)
};

const fr_meritbadges_title1 = /** @type {(inputs: Meritbadges_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badges de mérite`)
};

const ar_meritbadges_title1 = /** @type {(inputs: Meritbadges_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Merit Badges`)
};

/**
* | output |
* | --- |
* | "Merit Badges" |
*
* @param {Meritbadges_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const meritbadges_title1 = /** @type {((inputs?: Meritbadges_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Meritbadges_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_meritbadges_title1(inputs)
	if (locale === "es") return es_meritbadges_title1(inputs)
	if (locale === "fr") return fr_meritbadges_title1(inputs)
	return ar_meritbadges_title1(inputs)
});
export { meritbadges_title1 as "meritBadges.title" }