/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Guardianinvite_Inviteguardians2Inputs */

const en_family_guardianinvite_inviteguardians2 = /** @type {(inputs: Family_Guardianinvite_Inviteguardians2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invite Guardians`)
};

const es_family_guardianinvite_inviteguardians2 = /** @type {(inputs: Family_Guardianinvite_Inviteguardians2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invitar tutores`)
};

const fr_family_guardianinvite_inviteguardians2 = /** @type {(inputs: Family_Guardianinvite_Inviteguardians2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inviter des tuteurs`)
};

const ar_family_guardianinvite_inviteguardians2 = /** @type {(inputs: Family_Guardianinvite_Inviteguardians2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دعوة أولياء الأمور`)
};

/**
* | output |
* | --- |
* | "Invite Guardians" |
*
* @param {Family_Guardianinvite_Inviteguardians2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_guardianinvite_inviteguardians2 = /** @type {((inputs?: Family_Guardianinvite_Inviteguardians2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Guardianinvite_Inviteguardians2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_guardianinvite_inviteguardians2(inputs)
	if (locale === "es") return es_family_guardianinvite_inviteguardians2(inputs)
	if (locale === "fr") return fr_family_guardianinvite_inviteguardians2(inputs)
	return ar_family_guardianinvite_inviteguardians2(inputs)
});
export { family_guardianinvite_inviteguardians2 as "family.guardianInvite.inviteGuardians" }