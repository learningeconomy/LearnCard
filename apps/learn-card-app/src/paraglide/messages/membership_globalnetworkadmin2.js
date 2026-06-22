/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Membership_Globalnetworkadmin2Inputs */

const en_membership_globalnetworkadmin2 = /** @type {(inputs: Membership_Globalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Global Network Admin`)
};

const es_membership_globalnetworkadmin2 = /** @type {(inputs: Membership_Globalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrador de red global`)
};

const fr_membership_globalnetworkadmin2 = /** @type {(inputs: Membership_Globalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrateur réseau mondial`)
};

const ar_membership_globalnetworkadmin2 = /** @type {(inputs: Membership_Globalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسؤول الشبكة العالمية`)
};

/**
* | output |
* | --- |
* | "Global Network Admin" |
*
* @param {Membership_Globalnetworkadmin2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const membership_globalnetworkadmin2 = /** @type {((inputs?: Membership_Globalnetworkadmin2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Globalnetworkadmin2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_globalnetworkadmin2(inputs)
	if (locale === "es") return es_membership_globalnetworkadmin2(inputs)
	if (locale === "fr") return fr_membership_globalnetworkadmin2(inputs)
	return ar_membership_globalnetworkadmin2(inputs)
});
export { membership_globalnetworkadmin2 as "membership.globalNetworkAdmin" }