/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Members_HeadingInputs */

const en_troops_members_heading = /** @type {(inputs: Troops_Members_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Member`)
};

const es_troops_members_heading = /** @type {(inputs: Troops_Members_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Miembro`)
};

const fr_troops_members_heading = /** @type {(inputs: Troops_Members_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} Membre`)
};

const ar_troops_members_heading = /** @type {(inputs: Troops_Members_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} عضو`)
};

/**
* | output |
* | --- |
* | "{count} Member" |
*
* @param {Troops_Members_HeadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_members_heading = /** @type {((inputs?: Troops_Members_HeadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Members_HeadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_members_heading(inputs)
	if (locale === "es") return es_troops_members_heading(inputs)
	if (locale === "fr") return fr_troops_members_heading(inputs)
	return ar_troops_members_heading(inputs)
});
export { troops_members_heading as "troops.members.heading" }