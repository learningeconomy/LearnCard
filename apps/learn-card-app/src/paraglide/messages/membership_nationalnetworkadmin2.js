/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Membership_Nationalnetworkadmin2Inputs */

const en_membership_nationalnetworkadmin2 = /** @type {(inputs: Membership_Nationalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`National Network Admin`)
};

const es_membership_nationalnetworkadmin2 = /** @type {(inputs: Membership_Nationalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrador de red nacional`)
};

const de_membership_nationalnetworkadmin2 = /** @type {(inputs: Membership_Nationalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nationaler Netzwerk-Admin`)
};

const ar_membership_nationalnetworkadmin2 = /** @type {(inputs: Membership_Nationalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسؤول الشبكة الوطنية`)
};

const fr_membership_nationalnetworkadmin2 = /** @type {(inputs: Membership_Nationalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrateur réseau national`)
};

const ko_membership_nationalnetworkadmin2 = /** @type {(inputs: Membership_Nationalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`국가 네트워크 관리자`)
};

/**
* | output |
* | --- |
* | "National Network Admin" |
*
* @param {Membership_Nationalnetworkadmin2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const membership_nationalnetworkadmin2 = /** @type {((inputs?: Membership_Nationalnetworkadmin2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Nationalnetworkadmin2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_nationalnetworkadmin2(inputs)
	if (locale === "es") return es_membership_nationalnetworkadmin2(inputs)
	if (locale === "de") return de_membership_nationalnetworkadmin2(inputs)
	if (locale === "ar") return ar_membership_nationalnetworkadmin2(inputs)
	if (locale === "fr") return fr_membership_nationalnetworkadmin2(inputs)
	return ko_membership_nationalnetworkadmin2(inputs)
});
export { membership_nationalnetworkadmin2 as "membership.nationalNetworkAdmin" }