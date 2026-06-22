/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Leave_Successtitle1Inputs */

const en_family_leave_successtitle1 = /** @type {(inputs: Family_Leave_Successtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Family Left Successfully`)
};

const es_family_leave_successtitle1 = /** @type {(inputs: Family_Leave_Successtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saliste de la familia correctamente`)
};

const fr_family_leave_successtitle1 = /** @type {(inputs: Family_Leave_Successtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez quitté la famille`)
};

const ar_family_leave_successtitle1 = /** @type {(inputs: Family_Leave_Successtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت مغادرة العائلة بنجاح`)
};

/**
* | output |
* | --- |
* | "Family Left Successfully" |
*
* @param {Family_Leave_Successtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_leave_successtitle1 = /** @type {((inputs?: Family_Leave_Successtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Leave_Successtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_leave_successtitle1(inputs)
	if (locale === "es") return es_family_leave_successtitle1(inputs)
	if (locale === "fr") return fr_family_leave_successtitle1(inputs)
	return ar_family_leave_successtitle1(inputs)
});
export { family_leave_successtitle1 as "family.leave.successTitle" }