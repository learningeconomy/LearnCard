/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Membership_TroopsInputs */

const en_membership_troops = /** @type {(inputs: Membership_TroopsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troops`)
};

const es_membership_troops = /** @type {(inputs: Membership_TroopsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troops`)
};

const fr_membership_troops = /** @type {(inputs: Membership_TroopsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troupes`)
};

const ar_membership_troops = /** @type {(inputs: Membership_TroopsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troops`)
};

/**
* | output |
* | --- |
* | "Troops" |
*
* @param {Membership_TroopsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const membership_troops = /** @type {((inputs?: Membership_TroopsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_TroopsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_troops(inputs)
	if (locale === "es") return es_membership_troops(inputs)
	if (locale === "fr") return fr_membership_troops(inputs)
	return ar_membership_troops(inputs)
});
export { membership_troops as "membership.troops" }