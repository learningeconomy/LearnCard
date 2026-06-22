/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Form_Relationship_FriendInputs */

const en_endorsement_form_relationship_friend = /** @type {(inputs: Endorsement_Form_Relationship_FriendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Friend`)
};

const es_endorsement_form_relationship_friend = /** @type {(inputs: Endorsement_Form_Relationship_FriendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Amigo`)
};

const fr_endorsement_form_relationship_friend = /** @type {(inputs: Endorsement_Form_Relationship_FriendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ami`)
};

const ar_endorsement_form_relationship_friend = /** @type {(inputs: Endorsement_Form_Relationship_FriendInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صديق`)
};

/**
* | output |
* | --- |
* | "Friend" |
*
* @param {Endorsement_Form_Relationship_FriendInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_relationship_friend = /** @type {((inputs?: Endorsement_Form_Relationship_FriendInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Relationship_FriendInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_relationship_friend(inputs)
	if (locale === "es") return es_endorsement_form_relationship_friend(inputs)
	if (locale === "fr") return fr_endorsement_form_relationship_friend(inputs)
	return ar_endorsement_form_relationship_friend(inputs)
});
export { endorsement_form_relationship_friend as "endorsement.form.relationship.friend" }