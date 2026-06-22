/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Leave_ActionInputs */

const en_family_leave_action = /** @type {(inputs: Family_Leave_ActionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leave`)
};

const es_family_leave_action = /** @type {(inputs: Family_Leave_ActionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salir`)
};

const fr_family_leave_action = /** @type {(inputs: Family_Leave_ActionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quitter`)
};

const ar_family_leave_action = /** @type {(inputs: Family_Leave_ActionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مغادرة`)
};

/**
* | output |
* | --- |
* | "Leave" |
*
* @param {Family_Leave_ActionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_leave_action = /** @type {((inputs?: Family_Leave_ActionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Leave_ActionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_leave_action(inputs)
	if (locale === "es") return es_family_leave_action(inputs)
	if (locale === "fr") return fr_family_leave_action(inputs)
	return ar_family_leave_action(inputs)
});
export { family_leave_action as "family.leave.action" }