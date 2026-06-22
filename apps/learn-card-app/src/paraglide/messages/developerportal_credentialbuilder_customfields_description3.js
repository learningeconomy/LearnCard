/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ code: NonNullable<unknown> }} Developerportal_Credentialbuilder_Customfields_Description3Inputs */

const en_developerportal_credentialbuilder_customfields_description3 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Description3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Add custom fields to store additional data in the credential's extensions. These will appear in ${i?.code}.`)
};

const es_developerportal_credentialbuilder_customfields_description3 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Description3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Añade campos personalizados para almacenar datos adicionales en las extensiones de la credencial. Aparecerán en ${i?.code}.`)
};

const fr_developerportal_credentialbuilder_customfields_description3 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Description3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ajoutez des champs personnalisés pour stocker des données supplémentaires dans les extensions du crédential. Ils apparaîtront dans ${i?.code}.`)
};

const ar_developerportal_credentialbuilder_customfields_description3 = /** @type {(inputs: Developerportal_Credentialbuilder_Customfields_Description3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`أضف حقولاً مخصصة لتخزين بيانات إضافية في ملحقات الاعتماد. ستظهر في ${i?.code}.`)
};

/**
* | output |
* | --- |
* | "Add custom fields to store additional data in the credential's extensions. These will appear in {code}." |
*
* @param {Developerportal_Credentialbuilder_Customfields_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_customfields_description3 = /** @type {((inputs: Developerportal_Credentialbuilder_Customfields_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Customfields_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_customfields_description3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_customfields_description3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_customfields_description3(inputs)
	return ar_developerportal_credentialbuilder_customfields_description3(inputs)
});
export { developerportal_credentialbuilder_customfields_description3 as "developerPortal.credentialBuilder.customFields.description" }