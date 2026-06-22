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

const fr_membership_adminpanel1 = /** @type {(inputs: Membership_Adminpanel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Panneau d'administration`)
};

const ar_membership_adminpanel1 = /** @type {(inputs: Membership_Adminpanel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لوحة الإدارة`)
};

/**
* | output |
* | --- |
* | "Admin Panel" |
*
* @param {Membership_Adminpanel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const membership_adminpanel1 = /** @type {((inputs?: Membership_Adminpanel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Adminpanel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_adminpanel1(inputs)
	if (locale === "es") return es_membership_adminpanel1(inputs)
	if (locale === "fr") return fr_membership_adminpanel1(inputs)
	return ar_membership_adminpanel1(inputs)
});
export { membership_adminpanel1 as "membership.adminPanel" }