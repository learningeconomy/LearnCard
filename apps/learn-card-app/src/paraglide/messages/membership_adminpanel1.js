/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Membership_Adminpanel1Inputs */

const en_membership_adminpanel1 = /** @type {(inputs: Membership_Adminpanel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin Panel`)
};

const es_membership_adminpanel1 = /** @type {(inputs: Membership_Adminpanel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Panel de administración`)
};

const de_membership_adminpanel1 = /** @type {(inputs: Membership_Adminpanel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin-Panel`)
};

const ar_membership_adminpanel1 = /** @type {(inputs: Membership_Adminpanel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لوحة الإدارة`)
};

const fr_membership_adminpanel1 = /** @type {(inputs: Membership_Adminpanel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Panneau d'administration`)
};

const ko_membership_adminpanel1 = /** @type {(inputs: Membership_Adminpanel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`관리 패널`)
};

/**
* | output |
* | --- |
* | "Admin Panel" |
*
* @param {Membership_Adminpanel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const membership_adminpanel1 = /** @type {((inputs?: Membership_Adminpanel1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Adminpanel1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_adminpanel1(inputs)
	if (locale === "es") return es_membership_adminpanel1(inputs)
	if (locale === "de") return de_membership_adminpanel1(inputs)
	if (locale === "ar") return ar_membership_adminpanel1(inputs)
	if (locale === "fr") return fr_membership_adminpanel1(inputs)
	return ko_membership_adminpanel1(inputs)
});
export { membership_adminpanel1 as "membership.adminPanel" }