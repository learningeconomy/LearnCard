/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Verify_Returnhome1Inputs */

const en_profile_verify_returnhome1 = /** @type {(inputs: Profile_Verify_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Return Home`)
};

const es_profile_verify_returnhome1 = /** @type {(inputs: Profile_Verify_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Regresar a casa`)
};

const fr_profile_verify_returnhome1 = /** @type {(inputs: Profile_Verify_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour à la maison`)
};

const ar_profile_verify_returnhome1 = /** @type {(inputs: Profile_Verify_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العودة إلى المنزل`)
};

/**
* | output |
* | --- |
* | "Return Home" |
*
* @param {Profile_Verify_Returnhome1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_verify_returnhome1 = /** @type {((inputs?: Profile_Verify_Returnhome1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Verify_Returnhome1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_verify_returnhome1(inputs)
	if (locale === "es") return es_profile_verify_returnhome1(inputs)
	if (locale === "fr") return fr_profile_verify_returnhome1(inputs)
	return ar_profile_verify_returnhome1(inputs)
});
export { profile_verify_returnhome1 as "profile.verify.returnHome" }