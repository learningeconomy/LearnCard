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

const fr_membership_nationalnetworkadmin2 = /** @type {(inputs: Membership_Nationalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrateur réseau national`)
};

const ar_membership_nationalnetworkadmin2 = /** @type {(inputs: Membership_Nationalnetworkadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسؤول الشبكة الوطنية`)
};

/**
* | output |
* | --- |
* | "National Network Admin" |
*
* @param {Membership_Nationalnetworkadmin2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const membership_nationalnetworkadmin2 = /** @type {((inputs?: Membership_Nationalnetworkadmin2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Nationalnetworkadmin2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_nationalnetworkadmin2(inputs)
	if (locale === "es") return es_membership_nationalnetworkadmin2(inputs)
	if (locale === "fr") return fr_membership_nationalnetworkadmin2(inputs)
	return ar_membership_nationalnetworkadmin2(inputs)
});
export { membership_nationalnetworkadmin2 as "membership.nationalNetworkAdmin" }