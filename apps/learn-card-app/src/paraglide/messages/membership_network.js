/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Membership_NetworkInputs */

const en_membership_network = /** @type {(inputs: Membership_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network`)
};

const es_membership_network = /** @type {(inputs: Membership_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Red`)
};

const fr_membership_network = /** @type {(inputs: Membership_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau`)
};

const ar_membership_network = /** @type {(inputs: Membership_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشبكة`)
};

/**
* | output |
* | --- |
* | "Network" |
*
* @param {Membership_NetworkInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const membership_network = /** @type {((inputs?: Membership_NetworkInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_NetworkInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_network(inputs)
	if (locale === "es") return es_membership_network(inputs)
	if (locale === "fr") return fr_membership_network(inputs)
	return ar_membership_network(inputs)
});
export { membership_network as "membership.network" }