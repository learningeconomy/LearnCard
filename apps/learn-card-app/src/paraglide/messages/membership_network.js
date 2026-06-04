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

const de_membership_network = /** @type {(inputs: Membership_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Netzwerk`)
};

const ar_membership_network = /** @type {(inputs: Membership_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشبكة`)
};

const fr_membership_network = /** @type {(inputs: Membership_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau`)
};

const ko_membership_network = /** @type {(inputs: Membership_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`네트워크`)
};

/**
* | output |
* | --- |
* | "Network" |
*
* @param {Membership_NetworkInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const membership_network = /** @type {((inputs?: Membership_NetworkInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_NetworkInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_network(inputs)
	if (locale === "es") return es_membership_network(inputs)
	if (locale === "de") return de_membership_network(inputs)
	if (locale === "ar") return ar_membership_network(inputs)
	if (locale === "fr") return fr_membership_network(inputs)
	return ko_membership_network(inputs)
});
export { membership_network as "membership.network" }