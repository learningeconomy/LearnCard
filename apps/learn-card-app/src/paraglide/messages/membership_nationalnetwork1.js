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

const fr_membership_nationalnetwork1 = /** @type {(inputs: Membership_Nationalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau national`)
};

const ar_membership_nationalnetwork1 = /** @type {(inputs: Membership_Nationalnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشبكة الوطنية`)
};

/**
* | output |
* | --- |
* | "National Network" |
*
* @param {Membership_Nationalnetwork1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const membership_nationalnetwork1 = /** @type {((inputs?: Membership_Nationalnetwork1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Nationalnetwork1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_nationalnetwork1(inputs)
	if (locale === "es") return es_membership_nationalnetwork1(inputs)
	if (locale === "fr") return fr_membership_nationalnetwork1(inputs)
	return ar_membership_nationalnetwork1(inputs)
});
export { membership_nationalnetwork1 as "membership.nationalNetwork" }