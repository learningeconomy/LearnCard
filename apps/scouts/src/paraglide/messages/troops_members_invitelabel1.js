/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Members_Invitelabel1Inputs */

const en_troops_members_invitelabel1 = /** @type {(inputs: Troops_Members_Invitelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invite new member`)
};

const es_troops_members_invitelabel1 = /** @type {(inputs: Troops_Members_Invitelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invitar nuevo miembro`)
};

const fr_troops_members_invitelabel1 = /** @type {(inputs: Troops_Members_Invitelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inviter un nouveau membre`)
};

const ar_troops_members_invitelabel1 = /** @type {(inputs: Troops_Members_Invitelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invite new member`)
};

/**
* | output |
* | --- |
* | "Invite new member" |
*
* @param {Troops_Members_Invitelabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_members_invitelabel1 = /** @type {((inputs?: Troops_Members_Invitelabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Members_Invitelabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_members_invitelabel1(inputs)
	if (locale === "es") return es_troops_members_invitelabel1(inputs)
	if (locale === "fr") return fr_troops_members_invitelabel1(inputs)
	return ar_troops_members_invitelabel1(inputs)
});
export { troops_members_invitelabel1 as "troops.members.inviteLabel" }