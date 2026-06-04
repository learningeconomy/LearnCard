/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Membership_Myhub1Inputs */

const en_membership_myhub1 = /** @type {(inputs: Membership_Myhub1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Hub`)
};

const es_membership_myhub1 = /** @type {(inputs: Membership_Myhub1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mi hub`)
};

const de_membership_myhub1 = /** @type {(inputs: Membership_Myhub1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mein Hub`)
};

const ar_membership_myhub1 = /** @type {(inputs: Membership_Myhub1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مركزي`)
};

const fr_membership_myhub1 = /** @type {(inputs: Membership_Myhub1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mon hub`)
};

const ko_membership_myhub1 = /** @type {(inputs: Membership_Myhub1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`내 허브`)
};

/**
* | output |
* | --- |
* | "My Hub" |
*
* @param {Membership_Myhub1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const membership_myhub1 = /** @type {((inputs?: Membership_Myhub1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Myhub1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_myhub1(inputs)
	if (locale === "es") return es_membership_myhub1(inputs)
	if (locale === "de") return de_membership_myhub1(inputs)
	if (locale === "ar") return ar_membership_myhub1(inputs)
	if (locale === "fr") return fr_membership_myhub1(inputs)
	return ko_membership_myhub1(inputs)
});
export { membership_myhub1 as "membership.myHub" }