/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Editview_Walletcategory5Inputs */

const en_passport_buildmylearncard_editview_walletcategory5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Walletcategory5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wallet category:`)
};

const es_passport_buildmylearncard_editview_walletcategory5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Walletcategory5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Categoría de la billetera:`)
};

const fr_passport_buildmylearncard_editview_walletcategory5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Walletcategory5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Catégorie du portefeuille :`)
};

const ar_passport_buildmylearncard_editview_walletcategory5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Walletcategory5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فئة المحفظة:`)
};

/**
* | output |
* | --- |
* | "Wallet category:" |
*
* @param {Passport_Buildmylearncard_Editview_Walletcategory5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_editview_walletcategory5 = /** @type {((inputs?: Passport_Buildmylearncard_Editview_Walletcategory5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Editview_Walletcategory5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_editview_walletcategory5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_editview_walletcategory5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_editview_walletcategory5(inputs)
	return ar_passport_buildmylearncard_editview_walletcategory5(inputs)
});
export { passport_buildmylearncard_editview_walletcategory5 as "passport.buildMyLearnCard.editView.walletCategory" }