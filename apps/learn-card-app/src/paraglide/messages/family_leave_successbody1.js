/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ family: NonNullable<unknown> }} Family_Leave_Successbody1Inputs */

const en_family_leave_successbody1 = /** @type {(inputs: Family_Leave_Successbody1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`You have left ${i?.family}. You can now join or create another family.`)
};

const es_family_leave_successbody1 = /** @type {(inputs: Family_Leave_Successbody1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Has salido de ${i?.family}. Ahora puedes unirte o crear otra familia.`)
};

const fr_family_leave_successbody1 = /** @type {(inputs: Family_Leave_Successbody1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Vous avez quitté ${i?.family}. Vous pouvez maintenant rejoindre ou créer une autre famille.`)
};

const ar_family_leave_successbody1 = /** @type {(inputs: Family_Leave_Successbody1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لقد غادرت ${i?.family}. يمكنك الآن الانضمام إلى عائلة أخرى أو إنشاء واحدة.`)
};

/**
* | output |
* | --- |
* | "You have left {family}. You can now join or create another family." |
*
* @param {Family_Leave_Successbody1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_leave_successbody1 = /** @type {((inputs: Family_Leave_Successbody1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Leave_Successbody1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_leave_successbody1(inputs)
	if (locale === "es") return es_family_leave_successbody1(inputs)
	if (locale === "fr") return fr_family_leave_successbody1(inputs)
	return ar_family_leave_successbody1(inputs)
});
export { family_leave_successbody1 as "family.leave.successBody" }