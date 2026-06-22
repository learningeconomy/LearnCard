/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Demoschool_Nocredentials5Inputs */

const en_passport_buildmylearncard_demoschool_nocredentials5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Nocredentials5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Demo credentials found. Please try again.`)
};

const es_passport_buildmylearncard_demoschool_nocredentials5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Nocredentials5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron credenciales de demostración. Inténtalo de nuevo.`)
};

const fr_passport_buildmylearncard_demoschool_nocredentials5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Nocredentials5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune référence de démonstration trouvée. Veuillez réessayer.`)
};

const ar_passport_buildmylearncard_demoschool_nocredentials5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Nocredentials5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على اعتمادات تجريبية. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "No Demo credentials found. Please try again." |
*
* @param {Passport_Buildmylearncard_Demoschool_Nocredentials5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_demoschool_nocredentials5 = /** @type {((inputs?: Passport_Buildmylearncard_Demoschool_Nocredentials5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Demoschool_Nocredentials5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_demoschool_nocredentials5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_demoschool_nocredentials5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_demoschool_nocredentials5(inputs)
	return ar_passport_buildmylearncard_demoschool_nocredentials5(inputs)
});
export { passport_buildmylearncard_demoschool_nocredentials5 as "passport.buildMyLearnCard.demoSchool.noCredentials" }