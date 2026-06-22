/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Header_Profilealt1Inputs */

const en_dashboard_header_profilealt1 = /** @type {(inputs: Dashboard_Header_Profilealt1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile`)
};

const es_dashboard_header_profilealt1 = /** @type {(inputs: Dashboard_Header_Profilealt1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Perfil`)
};

const fr_dashboard_header_profilealt1 = /** @type {(inputs: Dashboard_Header_Profilealt1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profil`)
};

const ar_dashboard_header_profilealt1 = /** @type {(inputs: Dashboard_Header_Profilealt1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الملف الشخصي`)
};

/**
* | output |
* | --- |
* | "Profile" |
*
* @param {Dashboard_Header_Profilealt1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_profilealt1 = /** @type {((inputs?: Dashboard_Header_Profilealt1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_Profilealt1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_profilealt1(inputs)
	if (locale === "es") return es_dashboard_header_profilealt1(inputs)
	if (locale === "fr") return fr_dashboard_header_profilealt1(inputs)
	return ar_dashboard_header_profilealt1(inputs)
});
export { dashboard_header_profilealt1 as "dashboard.header.profileAlt" }