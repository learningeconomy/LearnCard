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

const fr_membership_myhub1 = /** @type {(inputs: Membership_Myhub1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mon hub`)
};

const ar_membership_myhub1 = /** @type {(inputs: Membership_Myhub1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مركزي`)
};

/**
* | output |
* | --- |
* | "My Hub" |
*
* @param {Membership_Myhub1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const membership_myhub1 = /** @type {((inputs?: Membership_Myhub1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Myhub1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_myhub1(inputs)
	if (locale === "es") return es_membership_myhub1(inputs)
	if (locale === "fr") return fr_membership_myhub1(inputs)
	return ar_membership_myhub1(inputs)
});
export { membership_myhub1 as "membership.myHub" }