/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Phone_Setasprimary2Inputs */

const en_profile_phone_setasprimary2 = /** @type {(inputs: Profile_Phone_Setasprimary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set as Primary`)
};

const es_profile_phone_setasprimary2 = /** @type {(inputs: Profile_Phone_Setasprimary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Establecer como principal`)
};

const fr_profile_phone_setasprimary2 = /** @type {(inputs: Profile_Phone_Setasprimary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Définir comme principal`)
};

const ar_profile_phone_setasprimary2 = /** @type {(inputs: Profile_Phone_Setasprimary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعيين كأساسي`)
};

/**
* | output |
* | --- |
* | "Set as Primary" |
*
* @param {Profile_Phone_Setasprimary2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_phone_setasprimary2 = /** @type {((inputs?: Profile_Phone_Setasprimary2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Phone_Setasprimary2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_phone_setasprimary2(inputs)
	if (locale === "es") return es_profile_phone_setasprimary2(inputs)
	if (locale === "fr") return fr_profile_phone_setasprimary2(inputs)
	return ar_profile_phone_setasprimary2(inputs)
});
export { profile_phone_setasprimary2 as "profile.phone.setAsPrimary" }