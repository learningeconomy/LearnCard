/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Passport_Buildmylearncard_Demoschool_Description4Inputs */

const en_passport_buildmylearncard_demoschool_description4 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Description4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Connect to a sample school, sync demo badges and credentials, and explore how ${i?.brand} works.`)
};

const es_passport_buildmylearncard_demoschool_description4 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Description4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Conéctate a una escuela de ejemplo, sincroniza insignias y credenciales de demostración, y explora cómo funciona ${i?.brand}.`)
};

const fr_passport_buildmylearncard_demoschool_description4 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Description4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Connectez-vous à un exemple d’école, synchronisez des badges et des références de démonstration, et découvrez comment ${i?.brand} fonctionne.`)
};

const ar_passport_buildmylearncard_demoschool_description4 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Description4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`اتصل بمدرسة نموذجية، وقم بمزامنة الشارات والاعتمادات التجريبية، واستكشف كيف يعمل ${i?.brand}.`)
};

/**
* | output |
* | --- |
* | "Connect to a sample school, sync demo badges and credentials, and explore how {brand} works." |
*
* @param {Passport_Buildmylearncard_Demoschool_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_demoschool_description4 = /** @type {((inputs: Passport_Buildmylearncard_Demoschool_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Demoschool_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_demoschool_description4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_demoschool_description4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_demoschool_description4(inputs)
	return ar_passport_buildmylearncard_demoschool_description4(inputs)
});
export { passport_buildmylearncard_demoschool_description4 as "passport.buildMyLearnCard.demoSchool.description" }