/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Components_Accountselector_Organizationcreated3Inputs */

const en_developerportal_components_accountselector_organizationcreated3 = /** @type {(inputs: Developerportal_Components_Accountselector_Organizationcreated3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Organization "${i?.name}" created successfully!`)
};

const es_developerportal_components_accountselector_organizationcreated3 = /** @type {(inputs: Developerportal_Components_Accountselector_Organizationcreated3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¡Organización "${i?.name}" creada exitosamente!`)
};

const fr_developerportal_components_accountselector_organizationcreated3 = /** @type {(inputs: Developerportal_Components_Accountselector_Organizationcreated3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Organisation "${i?.name}" créée avec succès !`)
};

const ar_developerportal_components_accountselector_organizationcreated3 = /** @type {(inputs: Developerportal_Components_Accountselector_Organizationcreated3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم إنشاء المؤسسة "${i?.name}" بنجاح!`)
};

/**
* | output |
* | --- |
* | "Organization \"{name}\" created successfully!" |
*
* @param {Developerportal_Components_Accountselector_Organizationcreated3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_organizationcreated3 = /** @type {((inputs: Developerportal_Components_Accountselector_Organizationcreated3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Organizationcreated3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_organizationcreated3(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_organizationcreated3(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_organizationcreated3(inputs)
	return ar_developerportal_components_accountselector_organizationcreated3(inputs)
});
export { developerportal_components_accountselector_organizationcreated3 as "developerPortal.components.accountSelector.organizationCreated" }