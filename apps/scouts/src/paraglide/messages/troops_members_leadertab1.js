/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Members_Leadertab1Inputs */

const en_troops_members_leadertab1 = /** @type {(inputs: Troops_Members_Leadertab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Leader`)
};

const es_troops_members_leadertab1 = /** @type {(inputs: Troops_Members_Leadertab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Líder`)
};

const fr_troops_members_leadertab1 = /** @type {(inputs: Troops_Members_Leadertab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Responsable`)
};

const ar_troops_members_leadertab1 = /** @type {(inputs: Troops_Members_Leadertab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} قائد`)
};

/**
* | output |
* | --- |
* | "{count} Leader" |
*
* @param {Troops_Members_Leadertab1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_members_leadertab1 = /** @type {((inputs?: Troops_Members_Leadertab1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Members_Leadertab1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_members_leadertab1(inputs)
	if (locale === "es") return es_troops_members_leadertab1(inputs)
	if (locale === "fr") return fr_troops_members_leadertab1(inputs)
	return ar_troops_members_leadertab1(inputs)
});
export { troops_members_leadertab1 as "troops.members.leaderTab" }