/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Profileid3Inputs */

const en_developerportal_components_accountselector_profileid3 = /** @type {(inputs: Developerportal_Components_Accountselector_Profileid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile ID`)
};

const es_developerportal_components_accountselector_profileid3 = /** @type {(inputs: Developerportal_Components_Accountselector_Profileid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de Perfil`)
};

const fr_developerportal_components_accountselector_profileid3 = /** @type {(inputs: Developerportal_Components_Accountselector_Profileid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de Profil`)
};

const ar_developerportal_components_accountselector_profileid3 = /** @type {(inputs: Developerportal_Components_Accountselector_Profileid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف الملف الشخصي`)
};

/**
* | output |
* | --- |
* | "Profile ID" |
*
* @param {Developerportal_Components_Accountselector_Profileid3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_profileid3 = /** @type {((inputs?: Developerportal_Components_Accountselector_Profileid3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Profileid3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_profileid3(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_profileid3(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_profileid3(inputs)
	return ar_developerportal_components_accountselector_profileid3(inputs)
});
export { developerportal_components_accountselector_profileid3 as "developerPortal.components.accountSelector.profileId" }