/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Header_Memberrole1Inputs */

const en_dashboard_header_memberrole1 = /** @type {(inputs: Dashboard_Header_Memberrole1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Member`)
};

const es_dashboard_header_memberrole1 = /** @type {(inputs: Dashboard_Header_Memberrole1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Miembro`)
};

const fr_dashboard_header_memberrole1 = /** @type {(inputs: Dashboard_Header_Memberrole1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membre`)
};

const ar_dashboard_header_memberrole1 = /** @type {(inputs: Dashboard_Header_Memberrole1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عضو`)
};

/**
* | output |
* | --- |
* | "Member" |
*
* @param {Dashboard_Header_Memberrole1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_memberrole1 = /** @type {((inputs?: Dashboard_Header_Memberrole1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_Memberrole1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_memberrole1(inputs)
	if (locale === "es") return es_dashboard_header_memberrole1(inputs)
	if (locale === "fr") return fr_dashboard_header_memberrole1(inputs)
	return ar_dashboard_header_memberrole1(inputs)
});
export { dashboard_header_memberrole1 as "dashboard.header.memberRole" }