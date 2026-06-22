/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Membership_Globalnetwork1Inputs */

const en_membership_globalnetwork1 = /** @type {(inputs: Membership_Globalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Global Network`)
};

const es_membership_globalnetwork1 = /** @type {(inputs: Membership_Globalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Red global`)
};

const fr_membership_globalnetwork1 = /** @type {(inputs: Membership_Globalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau mondial`)
};

const ar_membership_globalnetwork1 = /** @type {(inputs: Membership_Globalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشبكة العالمية`)
};

/**
* | output |
* | --- |
* | "Global Network" |
*
* @param {Membership_Globalnetwork1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const membership_globalnetwork1 = /** @type {((inputs?: Membership_Globalnetwork1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Globalnetwork1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_globalnetwork1(inputs)
	if (locale === "es") return es_membership_globalnetwork1(inputs)
	if (locale === "fr") return fr_membership_globalnetwork1(inputs)
	return ar_membership_globalnetwork1(inputs)
});
export { membership_globalnetwork1 as "membership.globalNetwork" }