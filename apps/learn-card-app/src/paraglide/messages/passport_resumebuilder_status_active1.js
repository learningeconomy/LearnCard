/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Status_Active1Inputs */

const en_passport_resumebuilder_status_active1 = /** @type {(inputs: Passport_Resumebuilder_Status_Active1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Active`)
};

const es_passport_resumebuilder_status_active1 = /** @type {(inputs: Passport_Resumebuilder_Status_Active1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activo`)
};

const fr_passport_resumebuilder_status_active1 = /** @type {(inputs: Passport_Resumebuilder_Status_Active1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actif`)
};

const ar_passport_resumebuilder_status_active1 = /** @type {(inputs: Passport_Resumebuilder_Status_Active1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نشطة`)
};

/**
* | output |
* | --- |
* | "Active" |
*
* @param {Passport_Resumebuilder_Status_Active1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_status_active1 = /** @type {((inputs?: Passport_Resumebuilder_Status_Active1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Status_Active1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_status_active1(inputs)
	if (locale === "es") return es_passport_resumebuilder_status_active1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_status_active1(inputs)
	return ar_passport_resumebuilder_status_active1(inputs)
});
export { passport_resumebuilder_status_active1 as "passport.resumeBuilder.status.active" }