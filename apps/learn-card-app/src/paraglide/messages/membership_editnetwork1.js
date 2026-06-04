/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Membership_Editnetwork1Inputs */

const en_membership_editnetwork1 = /** @type {(inputs: Membership_Editnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Network`)
};

const es_membership_editnetwork1 = /** @type {(inputs: Membership_Editnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar red`)
};

const de_membership_editnetwork1 = /** @type {(inputs: Membership_Editnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Netzwerk bearbeiten`)
};

const ar_membership_editnetwork1 = /** @type {(inputs: Membership_Editnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل الشبكة`)
};

const fr_membership_editnetwork1 = /** @type {(inputs: Membership_Editnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le réseau`)
};

const ko_membership_editnetwork1 = /** @type {(inputs: Membership_Editnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`네트워크 편집`)
};

/**
* | output |
* | --- |
* | "Edit Network" |
*
* @param {Membership_Editnetwork1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const membership_editnetwork1 = /** @type {((inputs?: Membership_Editnetwork1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Editnetwork1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_editnetwork1(inputs)
	if (locale === "es") return es_membership_editnetwork1(inputs)
	if (locale === "de") return de_membership_editnetwork1(inputs)
	if (locale === "ar") return ar_membership_editnetwork1(inputs)
	if (locale === "fr") return fr_membership_editnetwork1(inputs)
	return ko_membership_editnetwork1(inputs)
});
export { membership_editnetwork1 as "membership.editNetwork" }