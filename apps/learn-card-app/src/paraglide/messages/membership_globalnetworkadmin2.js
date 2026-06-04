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

const de_membership_globalnetworkadmin2 = /** @type {(inputs: Membership_Globalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Globaler Netzwerk-Admin`)
};

const ar_membership_globalnetworkadmin2 = /** @type {(inputs: Membership_Globalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسؤول الشبكة العالمية`)
};

const fr_membership_globalnetworkadmin2 = /** @type {(inputs: Membership_Globalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrateur réseau mondial`)
};

const ko_membership_globalnetworkadmin2 = /** @type {(inputs: Membership_Globalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`글로벌 네트워크 관리자`)
};

/**
* | output |
* | --- |
* | "Global Network Admin" |
*
* @param {Membership_Globalnetworkadmin2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const membership_globalnetworkadmin2 = /** @type {((inputs?: Membership_Globalnetworkadmin2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Globalnetworkadmin2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_globalnetworkadmin2(inputs)
	if (locale === "es") return es_membership_globalnetworkadmin2(inputs)
	if (locale === "de") return de_membership_globalnetworkadmin2(inputs)
	if (locale === "ar") return ar_membership_globalnetworkadmin2(inputs)
	if (locale === "fr") return fr_membership_globalnetworkadmin2(inputs)
	return ko_membership_globalnetworkadmin2(inputs)
});
export { membership_globalnetworkadmin2 as "membership.globalNetworkAdmin" }