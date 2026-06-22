/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Rawvc_Placeholder5Inputs */

const en_passport_buildmylearncard_managers_rawvc_placeholder5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Placeholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste your JSON here...`)
};

const es_passport_buildmylearncard_managers_rawvc_placeholder5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Placeholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pega tu JSON aquí...`)
};

const fr_passport_buildmylearncard_managers_rawvc_placeholder5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Placeholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collez votre JSON ici...`)
};

const ar_passport_buildmylearncard_managers_rawvc_placeholder5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Placeholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصق JSON هنا...`)
};

/**
* | output |
* | --- |
* | "Paste your JSON here..." |
*
* @param {Passport_Buildmylearncard_Managers_Rawvc_Placeholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_rawvc_placeholder5 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Rawvc_Placeholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Rawvc_Placeholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_rawvc_placeholder5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_rawvc_placeholder5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_rawvc_placeholder5(inputs)
	return ar_passport_buildmylearncard_managers_rawvc_placeholder5(inputs)
});
export { passport_buildmylearncard_managers_rawvc_placeholder5 as "passport.buildMyLearnCard.managers.rawVC.placeholder" }