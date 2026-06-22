/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Apitokenstep_Description4Inputs */

const en_developerportal_guides_issuecredentials_apitokenstep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your server needs an API token to authenticate with LearnCard. This token should be kept secret and never exposed in client-side code.`)
};

const es_developerportal_guides_issuecredentials_apitokenstep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu servidor necesita un token de API para autenticarse con LearnCard. Este token debe mantenerse en secreto y nunca exponerse en código del lado del cliente.`)
};

const fr_developerportal_guides_issuecredentials_apitokenstep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre serveur a besoin d'un jeton API pour s'authentifier auprès de LearnCard. Ce jeton doit rester secret et ne jamais être exposé dans le code côté client.`)
};

const ar_developerportal_guides_issuecredentials_apitokenstep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يحتاج الخادم الخاص بك إلى رمز API للمصادقة مع LearnCard. يجب الاحتفاظ بهذا الرمز سرياً وعدم عرضه أبداً في كود جانب العميل.`)
};

/**
* | output |
* | --- |
* | "Your server needs an API token to authenticate with LearnCard. This token should be kept secret and never exposed in client-side code." |
*
* @param {Developerportal_Guides_Issuecredentials_Apitokenstep_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_apitokenstep_description4 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Apitokenstep_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Apitokenstep_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_apitokenstep_description4(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_apitokenstep_description4(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_apitokenstep_description4(inputs)
	return ar_developerportal_guides_issuecredentials_apitokenstep_description4(inputs)
});
export { developerportal_guides_issuecredentials_apitokenstep_description4 as "developerPortal.guides.issueCredentials.apiTokenStep.description" }