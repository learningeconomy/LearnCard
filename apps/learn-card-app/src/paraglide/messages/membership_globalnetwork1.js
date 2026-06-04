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

const de_membership_globalnetwork1 = /** @type {(inputs: Membership_Globalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Globales Netzwerk`)
};

const ar_membership_globalnetwork1 = /** @type {(inputs: Membership_Globalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشبكة العالمية`)
};

const fr_membership_globalnetwork1 = /** @type {(inputs: Membership_Globalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau mondial`)
};

const ko_membership_globalnetwork1 = /** @type {(inputs: Membership_Globalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`글로벌 네트워크`)
};

/**
* | output |
* | --- |
* | "Global Network" |
*
* @param {Membership_Globalnetwork1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const membership_globalnetwork1 = /** @type {((inputs?: Membership_Globalnetwork1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Globalnetwork1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_globalnetwork1(inputs)
	if (locale === "es") return es_membership_globalnetwork1(inputs)
	if (locale === "de") return de_membership_globalnetwork1(inputs)
	if (locale === "ar") return ar_membership_globalnetwork1(inputs)
	if (locale === "fr") return fr_membership_globalnetwork1(inputs)
	return ko_membership_globalnetwork1(inputs)
});
export { membership_globalnetwork1 as "membership.globalNetwork" }