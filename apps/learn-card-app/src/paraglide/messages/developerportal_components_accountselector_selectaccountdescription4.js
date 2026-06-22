/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Selectaccountdescription4Inputs */

const en_developerportal_components_accountselector_selectaccountdescription4 = /** @type {(inputs: Developerportal_Components_Accountselector_Selectaccountdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose which account to use. This determines the DID, API keys, and branding.`)
};

const es_developerportal_components_accountselector_selectaccountdescription4 = /** @type {(inputs: Developerportal_Components_Accountselector_Selectaccountdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elija qué cuenta usar. Esto determina el DID, las claves API y la marca.`)
};

const fr_developerportal_components_accountselector_selectaccountdescription4 = /** @type {(inputs: Developerportal_Components_Accountselector_Selectaccountdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez quel compte utiliser. Cela détermine le DID, les clés API et l'image de marque.`)
};

const ar_developerportal_components_accountselector_selectaccountdescription4 = /** @type {(inputs: Developerportal_Components_Accountselector_Selectaccountdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر الحساب الذي تريد استخدامه. هذا يحدد DID ومفاتيح API والعلامة التجارية.`)
};

/**
* | output |
* | --- |
* | "Choose which account to use. This determines the DID, API keys, and branding." |
*
* @param {Developerportal_Components_Accountselector_Selectaccountdescription4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_selectaccountdescription4 = /** @type {((inputs?: Developerportal_Components_Accountselector_Selectaccountdescription4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Selectaccountdescription4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_selectaccountdescription4(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_selectaccountdescription4(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_selectaccountdescription4(inputs)
	return ar_developerportal_components_accountselector_selectaccountdescription4(inputs)
});
export { developerportal_components_accountselector_selectaccountdescription4 as "developerPortal.components.accountSelector.selectAccountDescription" }