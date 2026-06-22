/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Schema_Jsononlydescription4Inputs */

const en_developerportal_credentialbuilder_schema_jsononlydescription4 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Jsononlydescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This credential uses a custom schema that doesn't map to builder fields. Switch to the JSON tab to edit directly.`)
};

const es_developerportal_credentialbuilder_schema_jsononlydescription4 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Jsononlydescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta credencial usa un esquema personalizado que no se asigna a los campos del constructor. Cambia a la pestaña JSON para editar directamente.`)
};

const fr_developerportal_credentialbuilder_schema_jsononlydescription4 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Jsononlydescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce crédential utilise un schéma personnalisé qui ne correspond pas aux champs du constructeur. Passez à l'onglet JSON pour éditer directement.`)
};

const ar_developerportal_credentialbuilder_schema_jsononlydescription4 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Jsononlydescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يستخدم هذا الاعتماد مخططًا مخصصًا لا يتوافق مع حقول المنشئ. انتقل إلى علامة التبويب JSON للتحرير مباشرة.`)
};

/**
* | output |
* | --- |
* | "This credential uses a custom schema that doesn't map to builder fields. Switch to the JSON tab to edit directly." |
*
* @param {Developerportal_Credentialbuilder_Schema_Jsononlydescription4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_schema_jsononlydescription4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Schema_Jsononlydescription4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Schema_Jsononlydescription4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_schema_jsononlydescription4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_schema_jsononlydescription4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_schema_jsononlydescription4(inputs)
	return ar_developerportal_credentialbuilder_schema_jsononlydescription4(inputs)
});
export { developerportal_credentialbuilder_schema_jsononlydescription4 as "developerPortal.credentialBuilder.schema.jsonOnlyDescription" }