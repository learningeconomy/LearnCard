/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Demoschool_Confirmdelete5Inputs */

const en_passport_buildmylearncard_demoschool_confirmdelete5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Confirmdelete5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to delete all demo content? This action can’t be undone, but you can reload the demo content later if needed.`)
};

const es_passport_buildmylearncard_demoschool_confirmdelete5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Confirmdelete5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres eliminar todo el contenido de demostración? Esta acción no se puede deshacer, pero podrás volver a cargar el contenido de demostración más tarde si lo necesitas.`)
};

const fr_passport_buildmylearncard_demoschool_confirmdelete5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Confirmdelete5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous vraiment supprimer tout le contenu de démonstration ? Cette action est irréversible, mais vous pourrez recharger le contenu de démonstration plus tard si nécessaire.`)
};

const ar_passport_buildmylearncard_demoschool_confirmdelete5 = /** @type {(inputs: Passport_Buildmylearncard_Demoschool_Confirmdelete5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد حذف كل المحتوى التجريبي؟ لا يمكن التراجع عن هذا الإجراء، ولكن يمكنك إعادة تحميل المحتوى التجريبي لاحقًا إذا لزم الأمر.`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to delete all demo content? This action can’t be undone, but you can reload the demo content later if needed." |
*
* @param {Passport_Buildmylearncard_Demoschool_Confirmdelete5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_demoschool_confirmdelete5 = /** @type {((inputs?: Passport_Buildmylearncard_Demoschool_Confirmdelete5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Demoschool_Confirmdelete5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_demoschool_confirmdelete5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_demoschool_confirmdelete5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_demoschool_confirmdelete5(inputs)
	return ar_passport_buildmylearncard_demoschool_confirmdelete5(inputs)
});
export { passport_buildmylearncard_demoschool_confirmdelete5 as "passport.buildMyLearnCard.demoSchool.confirmDelete" }