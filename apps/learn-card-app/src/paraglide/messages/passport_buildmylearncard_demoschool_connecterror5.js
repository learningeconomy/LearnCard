/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Demoschool_Connecterror5Inputs */

const en_passport_buildmylearncard_demoschool_connecterror5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Connecterror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to connect to the demo school. Please try again.`)
};

const es_passport_buildmylearncard_demoschool_connecterror5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Connecterror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo conectar a la escuela de demostración. Inténtalo de nuevo.`)
};

const fr_passport_buildmylearncard_demoschool_connecterror5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Connecterror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de se connecter à l’école de démonstration. Veuillez réessayer.`)
};

const ar_passport_buildmylearncard_demoschool_connecterror5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Connecterror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذّر الاتصال بالمدرسة التجريبية. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Unable to connect to the demo school. Please try again." |
*
* @param {Passport_Buildmylearncard_Demoschool_Connecterror5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_demoschool_connecterror5 = /** @type {((inputs?: Passport_Buildmylearncard_Demoschool_Connecterror5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Demoschool_Connecterror5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_demoschool_connecterror5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_demoschool_connecterror5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_demoschool_connecterror5(inputs)
	return ar_passport_buildmylearncard_demoschool_connecterror5(inputs)
});
export { passport_buildmylearncard_demoschool_connecterror5 as "passport.buildMyLearnCard.demoSchool.connectError" }