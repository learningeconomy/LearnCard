/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Members_Invitebtn1Inputs */

const en_troops_members_invitebtn1 = /** @type {(inputs: Troops_Members_Invitebtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invite`)
};

const es_troops_members_invitebtn1 = /** @type {(inputs: Troops_Members_Invitebtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invitar`)
};

const fr_troops_members_invitebtn1 = /** @type {(inputs: Troops_Members_Invitebtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inviter`)
};

const ar_troops_members_invitebtn1 = /** @type {(inputs: Troops_Members_Invitebtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دعوة`)
};

/**
* | output |
* | --- |
* | "Invite" |
*
* @param {Troops_Members_Invitebtn1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_members_invitebtn1 = /** @type {((inputs?: Troops_Members_Invitebtn1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Members_Invitebtn1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_members_invitebtn1(inputs)
	if (locale === "es") return es_troops_members_invitebtn1(inputs)
	if (locale === "fr") return fr_troops_members_invitebtn1(inputs)
	return ar_troops_members_invitebtn1(inputs)
});
export { troops_members_invitebtn1 as "troops.members.inviteBtn" }