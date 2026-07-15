/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ search: NonNullable<unknown> }} Boostcms_Usecustomtype5Inputs */

const en_boostcms_usecustomtype5 = /** @type {(inputs: Boostcms_Usecustomtype5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Use "${i?.search}" anyways!`)
};

const es_boostcms_usecustomtype5 = /** @type {(inputs: Boostcms_Usecustomtype5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Usar "${i?.search}" de todos modos`)
};

const fr_boostcms_usecustomtype5 = /** @type {(inputs: Boostcms_Usecustomtype5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Utiliser « ${i?.search} » quand même !`)
};

const ar_boostcms_usecustomtype5 = /** @type {(inputs: Boostcms_Usecustomtype5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`استخدم "${i?.search}" على أي حال!`)
};

/**
* | output |
* | --- |
* | "Use \"{search}\" anyways!" |
*
* @param {Boostcms_Usecustomtype5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_usecustomtype5 = /** @type {((inputs: Boostcms_Usecustomtype5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Usecustomtype5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_usecustomtype5(inputs)
	if (locale === "es") return es_boostcms_usecustomtype5(inputs)
	if (locale === "fr") return fr_boostcms_usecustomtype5(inputs)
	return ar_boostcms_usecustomtype5(inputs)
});
export { boostcms_usecustomtype5 as "boostCMS.useCustomType" }