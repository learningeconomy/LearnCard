/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Demoschool_Connectsuccess5Inputs */

const en_passport_buildmylearncard_demoschool_connectsuccess5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Connectsuccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You have successfully connected to the demo school.`)
};

const es_passport_buildmylearncard_demoschool_connectsuccess5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Connectsuccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Te has conectado correctamente a la escuela de demostración.`)
};

const fr_passport_buildmylearncard_demoschool_connectsuccess5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Connectsuccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous êtes connecté à l’école de démonstration.`)
};

const ar_passport_buildmylearncard_demoschool_connectsuccess5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Connectsuccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد اتصلت بنجاح بالمدرسة التجريبية.`)
};

/**
* | output |
* | --- |
* | "You have successfully connected to the demo school." |
*
* @param {Passport_Buildmylearncard_Demoschool_Connectsuccess5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_demoschool_connectsuccess5 = /** @type {((inputs?: Passport_Buildmylearncard_Demoschool_Connectsuccess5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Demoschool_Connectsuccess5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_demoschool_connectsuccess5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_demoschool_connectsuccess5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_demoschool_connectsuccess5(inputs)
	return ar_passport_buildmylearncard_demoschool_connectsuccess5(inputs)
});
export { passport_buildmylearncard_demoschool_connectsuccess5 as "passport.buildMyLearnCard.demoSchool.connectSuccess" }