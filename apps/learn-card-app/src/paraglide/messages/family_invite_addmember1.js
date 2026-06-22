/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Family_Invite_Addmember1Inputs */

const en_family_invite_addmember1 = /** @type {(inputs: Family_Invite_Addmember1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Add a ${i?.title}`)
};

const es_family_invite_addmember1 = /** @type {(inputs: Family_Invite_Addmember1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Añadir un ${i?.title}`)
};

const fr_family_invite_addmember1 = /** @type {(inputs: Family_Invite_Addmember1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ajouter un ${i?.title}`)
};

const ar_family_invite_addmember1 = /** @type {(inputs: Family_Invite_Addmember1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إضافة ${i?.title}`)
};

/**
* | output |
* | --- |
* | "Add a {title}" |
*
* @param {Family_Invite_Addmember1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_invite_addmember1 = /** @type {((inputs: Family_Invite_Addmember1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Invite_Addmember1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_invite_addmember1(inputs)
	if (locale === "es") return es_family_invite_addmember1(inputs)
	if (locale === "fr") return fr_family_invite_addmember1(inputs)
	return ar_family_invite_addmember1(inputs)
});
export { family_invite_addmember1 as "family.invite.addMember" }