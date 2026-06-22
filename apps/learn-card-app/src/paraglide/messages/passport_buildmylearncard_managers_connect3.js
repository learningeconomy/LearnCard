/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Connect3Inputs */

const en_passport_buildmylearncard_managers_connect3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Connect3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect`)
};

const es_passport_buildmylearncard_managers_connect3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Connect3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conectar`)
};

const fr_passport_buildmylearncard_managers_connect3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Connect3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connecter`)
};

const ar_passport_buildmylearncard_managers_connect3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Connect3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ربط`)
};

/**
* | output |
* | --- |
* | "Connect" |
*
* @param {Passport_Buildmylearncard_Managers_Connect3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_connect3 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Connect3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Connect3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_connect3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_connect3(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_connect3(inputs)
	return ar_passport_buildmylearncard_managers_connect3(inputs)
});
export { passport_buildmylearncard_managers_connect3 as "passport.buildMyLearnCard.managers.connect" }