/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Membership_Nationalnetwork1Inputs */

const en_membership_nationalnetwork1 = /** @type {(inputs: Membership_Nationalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`National Network`)
};

const es_membership_nationalnetwork1 = /** @type {(inputs: Membership_Nationalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Red nacional`)
};

const de_membership_nationalnetwork1 = /** @type {(inputs: Membership_Nationalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nationale Netzwerk`)
};

const ar_membership_nationalnetwork1 = /** @type {(inputs: Membership_Nationalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشبكة الوطنية`)
};

const fr_membership_nationalnetwork1 = /** @type {(inputs: Membership_Nationalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau national`)
};

const ko_membership_nationalnetwork1 = /** @type {(inputs: Membership_Nationalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`국가 네트워크`)
};

/**
* | output |
* | --- |
* | "National Network" |
*
* @param {Membership_Nationalnetwork1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const membership_nationalnetwork1 = /** @type {((inputs?: Membership_Nationalnetwork1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Nationalnetwork1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_nationalnetwork1(inputs)
	if (locale === "es") return es_membership_nationalnetwork1(inputs)
	if (locale === "de") return de_membership_nationalnetwork1(inputs)
	if (locale === "ar") return ar_membership_nationalnetwork1(inputs)
	if (locale === "fr") return fr_membership_nationalnetwork1(inputs)
	return ko_membership_nationalnetwork1(inputs)
});
export { membership_nationalnetwork1 as "membership.nationalNetwork" }