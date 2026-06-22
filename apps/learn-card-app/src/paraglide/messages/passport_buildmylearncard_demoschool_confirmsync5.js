/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Demoschool_Confirmsync5Inputs */

const en_passport_buildmylearncard_demoschool_confirmsync5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Confirmsync5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to sync with the demo school? This will import multiple sample credentials, but you can easily delete them later.`)
};

const es_passport_buildmylearncard_demoschool_confirmsync5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Confirmsync5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres sincronizar con la escuela de demostración? Esto importará varias credenciales de ejemplo, pero podrás eliminarlas fácilmente más tarde.`)
};

const fr_passport_buildmylearncard_demoschool_confirmsync5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Confirmsync5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous vraiment vous synchroniser avec l’école de démonstration ? Cela importera plusieurs références d’exemple, mais vous pourrez facilement les supprimer plus tard.`)
};

const ar_passport_buildmylearncard_demoschool_confirmsync5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Confirmsync5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد المزامنة مع المدرسة التجريبية؟ سيؤدي ذلك إلى استيراد عدة اعتمادات نموذجية، ولكن يمكنك حذفها بسهولة لاحقًا.`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to sync with the demo school? This will import multiple sample credentials, but you can easily delete them later." |
*
* @param {Passport_Buildmylearncard_Demoschool_Confirmsync5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_demoschool_confirmsync5 = /** @type {((inputs?: Passport_Buildmylearncard_Demoschool_Confirmsync5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Demoschool_Confirmsync5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_demoschool_confirmsync5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_demoschool_confirmsync5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_demoschool_confirmsync5(inputs)
	return ar_passport_buildmylearncard_demoschool_confirmsync5(inputs)
});
export { passport_buildmylearncard_demoschool_confirmsync5 as "passport.buildMyLearnCard.demoSchool.confirmSync" }