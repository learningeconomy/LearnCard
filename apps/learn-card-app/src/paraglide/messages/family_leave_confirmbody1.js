/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Leave_Confirmbody1Inputs */

const en_family_leave_confirmbody1 = /** @type {(inputs: Family_Leave_Confirmbody1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leaving this family will remove your access to its profiles and data.`)
};

const es_family_leave_confirmbody1 = /** @type {(inputs: Family_Leave_Confirmbody1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salir de esta familia eliminará tu acceso a sus perfiles y datos.`)
};

const fr_family_leave_confirmbody1 = /** @type {(inputs: Family_Leave_Confirmbody1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quitter cette famille supprimera votre accès à ses profils et données.`)
};

const ar_family_leave_confirmbody1 = /** @type {(inputs: Family_Leave_Confirmbody1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ستؤدي مغادرة هذه العائلة إلى إزالة وصولك إلى ملفاتها وبياناتها.`)
};

/**
* | output |
* | --- |
* | "Leaving this family will remove your access to its profiles and data." |
*
* @param {Family_Leave_Confirmbody1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_leave_confirmbody1 = /** @type {((inputs?: Family_Leave_Confirmbody1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Leave_Confirmbody1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_leave_confirmbody1(inputs)
	if (locale === "es") return es_family_leave_confirmbody1(inputs)
	if (locale === "fr") return fr_family_leave_confirmbody1(inputs)
	return ar_family_leave_confirmbody1(inputs)
});
export { family_leave_confirmbody1 as "family.leave.confirmBody" }