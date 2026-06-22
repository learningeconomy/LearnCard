/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Customfields_Addfieldplaceholder5Inputs */

const en_developerportal_credentialbuilder_customfields_addfieldplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Addfieldplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Field name (e.g., courseId)`)
};

const es_developerportal_credentialbuilder_customfields_addfieldplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Addfieldplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del campo (ej., courseId)`)
};

const fr_developerportal_credentialbuilder_customfields_addfieldplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Addfieldplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du champ (ex., courseId)`)
};

const ar_developerportal_credentialbuilder_customfields_addfieldplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Addfieldplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم الحقل (مثال: courseId)`)
};

/**
* | output |
* | --- |
* | "Field name (e.g., courseId)" |
*
* @param {Developerportal_Credentialbuilder_Customfields_Addfieldplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_customfields_addfieldplaceholder5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Customfields_Addfieldplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Customfields_Addfieldplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_customfields_addfieldplaceholder5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_customfields_addfieldplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_customfields_addfieldplaceholder5(inputs)
	return ar_developerportal_credentialbuilder_customfields_addfieldplaceholder5(inputs)
});
export { developerportal_credentialbuilder_customfields_addfieldplaceholder5 as "developerPortal.credentialBuilder.customFields.addFieldPlaceholder" }