/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Introslides_Earnbadges2Inputs */

const en_introslides_earnbadges2 = /** @type {(inputs: Introslides_Earnbadges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Earn & Send Badges`)
};

const es_introslides_earnbadges2 = /** @type {(inputs: Introslides_Earnbadges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gana y Envía Insignias`)
};

const fr_introslides_earnbadges2 = /** @type {(inputs: Introslides_Earnbadges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gagnez et envoyez des badges`)
};

const ar_introslides_earnbadges2 = /** @type {(inputs: Introslides_Earnbadges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكسب وأرسل الشارات`)
};

/**
* | output |
* | --- |
* | "Earn & Send Badges" |
*
* @param {Introslides_Earnbadges2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const introslides_earnbadges2 = /** @type {((inputs?: Introslides_Earnbadges2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Introslides_Earnbadges2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_introslides_earnbadges2(inputs)
	if (locale === "es") return es_introslides_earnbadges2(inputs)
	if (locale === "fr") return fr_introslides_earnbadges2(inputs)
	return ar_introslides_earnbadges2(inputs)
});
export { introslides_earnbadges2 as "introSlides.earnBadges" }