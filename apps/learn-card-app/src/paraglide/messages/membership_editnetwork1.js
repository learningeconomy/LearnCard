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

const fr_membership_editnetwork1 = /** @type {(inputs: Membership_Editnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le réseau`)
};

const ar_membership_editnetwork1 = /** @type {(inputs: Membership_Editnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل الشبكة`)
};

/**
* | output |
* | --- |
* | "Edit Network" |
*
* @param {Membership_Editnetwork1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const membership_editnetwork1 = /** @type {((inputs?: Membership_Editnetwork1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Editnetwork1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_editnetwork1(inputs)
	if (locale === "es") return es_membership_editnetwork1(inputs)
	if (locale === "fr") return fr_membership_editnetwork1(inputs)
	return ar_membership_editnetwork1(inputs)
});
export { membership_editnetwork1 as "membership.editNetwork" }