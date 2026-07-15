/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Members_Scoutlabel1Inputs */

const en_troops_members_scoutlabel1 = /** @type {(inputs: Troops_Members_Scoutlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const es_troops_members_scoutlabel1 = /** @type {(inputs: Troops_Members_Scoutlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const fr_troops_members_scoutlabel1 = /** @type {(inputs: Troops_Members_Scoutlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const ar_troops_members_scoutlabel1 = /** @type {(inputs: Troops_Members_Scoutlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

/**
* | output |
* | --- |
* | "Scout" |
*
* @param {Troops_Members_Scoutlabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_members_scoutlabel1 = /** @type {((inputs?: Troops_Members_Scoutlabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Members_Scoutlabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_members_scoutlabel1(inputs)
	if (locale === "es") return es_troops_members_scoutlabel1(inputs)
	if (locale === "fr") return fr_troops_members_scoutlabel1(inputs)
	return ar_troops_members_scoutlabel1(inputs)
});
export { troops_members_scoutlabel1 as "troops.members.scoutLabel" }