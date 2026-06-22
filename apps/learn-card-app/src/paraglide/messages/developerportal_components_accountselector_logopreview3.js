/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Logopreview3Inputs */

const en_developerportal_components_accountselector_logopreview3 = /** @type {(inputs: Developerportal_Components_Accountselector_Logopreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logo preview`)
};

const es_developerportal_components_accountselector_logopreview3 = /** @type {(inputs: Developerportal_Components_Accountselector_Logopreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista previa del logotipo`)
};

const fr_developerportal_components_accountselector_logopreview3 = /** @type {(inputs: Developerportal_Components_Accountselector_Logopreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu du logo`)
};

const ar_developerportal_components_accountselector_logopreview3 = /** @type {(inputs: Developerportal_Components_Accountselector_Logopreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة الشعار`)
};

/**
* | output |
* | --- |
* | "Logo preview" |
*
* @param {Developerportal_Components_Accountselector_Logopreview3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_logopreview3 = /** @type {((inputs?: Developerportal_Components_Accountselector_Logopreview3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Logopreview3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_logopreview3(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_logopreview3(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_logopreview3(inputs)
	return ar_developerportal_components_accountselector_logopreview3(inputs)
});
export { developerportal_components_accountselector_logopreview3 as "developerPortal.components.accountSelector.logoPreview" }