/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Createcontractstep_Description4Inputs */

const en_developerportal_guides_consentflow_createcontractstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A consent contract defines what data you're requesting and why. Users must accept the contract before sharing their data.`)
};

const es_developerportal_guides_consentflow_createcontractstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un contrato de consentimiento define qué datos estás solicitando y por qué. Los usuarios deben aceptar el contrato antes de compartir sus datos.`)
};

const fr_developerportal_guides_consentflow_createcontractstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un contrat de consentement définit les données que vous demandez et pourquoi. Les utilisateurs doivent accepter le contrat avant de partager leurs données.`)
};

const ar_developerportal_guides_consentflow_createcontractstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يحدد عقد الموافقة البيانات التي تطلبها ولماذا. يجب على المستخدمين قبول العقد قبل مشاركة بياناتهم.`)
};

/**
* | output |
* | --- |
* | "A consent contract defines what data you're requesting and why. Users must accept the contract before sharing their data." |
*
* @param {Developerportal_Guides_Consentflow_Createcontractstep_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_createcontractstep_description4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Createcontractstep_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Createcontractstep_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_createcontractstep_description4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_createcontractstep_description4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_createcontractstep_description4(inputs)
	return ar_developerportal_guides_consentflow_createcontractstep_description4(inputs)
});
export { developerportal_guides_consentflow_createcontractstep_description4 as "developerPortal.guides.consentFlow.createContractStep.description" }