/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Meritbadges_Emptymsg2Inputs */

const en_meritbadges_emptymsg2 = /** @type {(inputs: Meritbadges_Emptymsg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You don't have any Merit Badges yet.`)
};

const es_meritbadges_emptymsg2 = /** @type {(inputs: Meritbadges_Emptymsg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no tienes Insignias de Mérito.`)
};

const fr_meritbadges_emptymsg2 = /** @type {(inputs: Meritbadges_Emptymsg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous n'avez pas encore de badges de mérite.`)
};

const ar_meritbadges_emptymsg2 = /** @type {(inputs: Meritbadges_Emptymsg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You don't have any Merit Badges yet.`)
};

/**
* | output |
* | --- |
* | "You don't have any Merit Badges yet." |
*
* @param {Meritbadges_Emptymsg2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const meritbadges_emptymsg2 = /** @type {((inputs?: Meritbadges_Emptymsg2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Meritbadges_Emptymsg2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_meritbadges_emptymsg2(inputs)
	if (locale === "es") return es_meritbadges_emptymsg2(inputs)
	if (locale === "fr") return fr_meritbadges_emptymsg2(inputs)
	return ar_meritbadges_emptymsg2(inputs)
});
export { meritbadges_emptymsg2 as "meritBadges.emptyMsg" }