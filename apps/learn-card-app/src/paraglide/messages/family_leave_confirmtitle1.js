/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Leave_Confirmtitle1Inputs */

const en_family_leave_confirmtitle1 = /** @type {(inputs: Family_Leave_Confirmtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leave Family?`)
};

const es_family_leave_confirmtitle1 = /** @type {(inputs: Family_Leave_Confirmtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Salir de la familia?`)
};

const fr_family_leave_confirmtitle1 = /** @type {(inputs: Family_Leave_Confirmtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quitter la famille ?`)
};

const ar_family_leave_confirmtitle1 = /** @type {(inputs: Family_Leave_Confirmtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مغادرة العائلة؟`)
};

/**
* | output |
* | --- |
* | "Leave Family?" |
*
* @param {Family_Leave_Confirmtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_leave_confirmtitle1 = /** @type {((inputs?: Family_Leave_Confirmtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Leave_Confirmtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_leave_confirmtitle1(inputs)
	if (locale === "es") return es_family_leave_confirmtitle1(inputs)
	if (locale === "fr") return fr_family_leave_confirmtitle1(inputs)
	return ar_family_leave_confirmtitle1(inputs)
});
export { family_leave_confirmtitle1 as "family.leave.confirmTitle" }